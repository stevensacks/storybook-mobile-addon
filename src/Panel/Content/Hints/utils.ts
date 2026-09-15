import type {Dispatch, SetStateAction} from 'react';
import {createScheduler} from 'lrt';
import getDomPath from './get-dom-path';
import type {
    Analysis,
    DangerZone,
    HTMLElementWithStyleSheets,
    MinSize,
    SuspectElementTuple,
    TouchTarget,
    Warnings,
} from './types';

const getElements = (container: HTMLElementWithStyleSheets, tag: string) => {
    const root = container.querySelector('#storybook-root');

    return Array.from(container.querySelectorAll(tag)).filter(
        (e) => !root || root.contains(e),
    );
};

const getStylesheetRules = (
    sheets: Record<string, CSSStyleSheet>,
    k: string,
) => {
    let rules: CSSRule[] = [];

    try {
        if (sheets[k]?.cssRules) {
            rules = Array.from(sheets[k].cssRules);
        }
    } catch {
        //
    }

    return rules;
};

const forEachRule = (
    container: HTMLElementWithStyleSheets,
    callback: (rule: CSSRule) => void,
) => {
    const sheets = container.styleSheets;

    Object.keys(sheets).forEach((k) => {
        getStylesheetRules(sheets, k).forEach((rule) => {
            if (rule) callback(rule);
        });
    });
};

const getNodeName = (element: Element) =>
    element.nodeName === 'A'
        ? 'a'
        : element.nodeName === 'BUTTON'
          ? 'button'
          : `${element.nodeName.toLowerCase()}[role="button"]`;

// A selector match can throw on some selector syntaxes in Safari; every
// caller that tests a precomputed selector against a candidate element
// wants the same "treat a throw as no match" behavior.
const safeMatches = (element: Element, selector: string) => {
    try {
        return element.matches(selector);
    } catch {
        return false;
    }
};

// button/[role="button"]/a elements are the candidate pool for several
// analyses below (touch target, tap highlight, active styles); computed
// once per scan and shared instead of each analysis re-querying the DOM.
const getTappableElements = (container: HTMLElementWithStyleSheets) =>
    Array.from(
        new Set(
            getElements(container, 'button')
                .concat(getElements(container, '[role="button"]'))
                .concat(getElements(container, 'a')),
        ),
    ) as HTMLElement[];

const attachLabels = (
    inputs: HTMLInputElement[],
    container: HTMLElementWithStyleSheets,
) =>
    inputs.map((input) => {
        let labelText = '';

        if (input.labels && input.labels[0]) {
            labelText = input.labels[0].textContent;
        } else if (input.parentElement?.nodeName === 'LABEL') {
            labelText = input.parentElement.textContent;
        } else if (input.id) {
            const label = container.querySelector(
                `label[for="${CSS.escape(input.id)}"]`,
            );
            if (label) labelText = label.textContent;
        }

        return {
            labelText,
            path: getDomPath(input),
            type: input.type,
        };
    });

const textInputs: Record<string, boolean> = {
    email: true,
    number: true,
    password: true,
    search: true,
    tel: true,
    text: true,
    url: true,
};

const getAutocompleteWarnings = (container: HTMLElementWithStyleSheets) => {
    const inputs = getElements(container, 'input');
    const warnings = inputs.filter((input) => {
        const currentType = input.getAttribute('type');
        const autocomplete = input.getAttribute('autocomplete');

        return currentType && textInputs[currentType] && !autocomplete;
    }) as HTMLInputElement[];

    return attachLabels(warnings, container);
};

const getInputTypeNumberWarnings = (container: HTMLElementWithStyleSheets) => {
    const inputs = getElements(
        container,
        'input[type="number"]',
    ) as HTMLInputElement[];

    return attachLabels(inputs, container);
};

const getInputTypeWarnings = (container: HTMLElementWithStyleSheets) => {
    const inputs = getElements(container, 'input[type="text"]')
        .concat(getElements(container, 'input:not([type])'))
        .filter(
            (input) => !input.getAttribute('inputmode'),
        ) as HTMLInputElement[];

    return attachLabels(inputs, container);
};

export const getInstantWarnings = (
    container: HTMLElementWithStyleSheets,
): Warnings => ({
    autocomplete: getAutocompleteWarnings(container),
    inputType: getInputTypeWarnings(container),
    inputTypeNumber: getInputTypeNumberWarnings(container),
});

// SCHEDULED ANALYSES
// We schedule these so the UI does not lock up while they're running

const isInside = (dangerZone: DangerZone, bounding: DOMRect) =>
    bounding.top <= dangerZone.bottom &&
    bounding.bottom >= dangerZone.top &&
    bounding.left <= dangerZone.right &&
    bounding.right >= dangerZone.left;

const toTouchTarget = (
    element: HTMLElement,
    bounding: DOMRect,
    close: SuspectElementTuple[],
): TouchTarget => ({
    close,
    height: Math.floor(bounding.height),
    html: element.innerHTML,
    path: getDomPath(element),
    text: element.textContent,
    type: getNodeName(element),
    width: Math.floor(bounding.width),
});

export const MIN_SIZE = 32;

export const RECOMMENDED_DISTANCE = 8;
//const RECOMMENDED_SIZE = 48

const checkMinSize = ({height, width}: MinSize) =>
    height < MIN_SIZE || width < MIN_SIZE;

function* getTouchTargetSizeWarning(elements: HTMLElement[]) {
    // elements is already deduped by getTappableElements, so an element
    // matching more than one selector (e.g. <button role="button">) is
    // only ever processed once here.
    //
    // Neighbor positions are a one-time snapshot, same as before this file
    // was touched: re-reading every candidate's rect on every iteration to
    // keep neighbor data fresh would turn this into O(elements) live reads
    // per element. The element actually being scored each iteration still
    // gets a fresh getBoundingClientRect() so a mid-scan reflow (an image
    // finishing loading, a viewport resize) between scheduler chunk
    // boundaries doesn't score it against stale, scan-start geometry.
    const snapshot: SuspectElementTuple[] = elements.map((element) => [
        element,
        element.getBoundingClientRect(),
    ]);

    const {length} = elements;
    const underMinSize = [];
    const tooClose = [];

    for (let index = 0; index < length; index++) {
        const element = elements[index];

        if (element) {
            const bounding = element.getBoundingClientRect();

            const dangerZone = {
                bottom: bounding.bottom + RECOMMENDED_DISTANCE,
                left: bounding.left - RECOMMENDED_DISTANCE,
                right: bounding.right + RECOMMENDED_DISTANCE,
                top: bounding.top - RECOMMENDED_DISTANCE,
            };

            const close = snapshot.filter(
                ([susElement, susBounding]) =>
                    susElement !== element && isInside(dangerZone, susBounding),
            );

            const isUnderMinSize = checkMinSize(bounding);

            if (isUnderMinSize || close.length > 0) {
                const touchTarget = toTouchTarget(element, bounding, close);

                if (isUnderMinSize) {
                    underMinSize.push(touchTarget);
                }

                if (close.length > 0) {
                    tooClose.push(touchTarget);
                }
            }
        }
        yield index;
    }

    return {tooClose, underMinSize};
}

function* getTapHighlightWarnings(elements: HTMLElement[]) {
    const {length} = elements;
    const result = [];

    for (let index = 0; index < length; index++) {
        const element = elements[index];

        if (
            element &&
            // @ts-expect-error `-webkit-tap-highlight-color` is a vendor-prefixed
            // property not present on the CSSStyleDeclaration index type
            getComputedStyle(element)['-webkit-tap-highlight-color'] ===
                'rgba(0, 0, 0, 0)'
        ) {
            result.push({
                html: element.innerHTML,
                path: getDomPath(element),
                text: element.textContent,
                type: getNodeName(element),
            });
        }
        yield index;
    }

    return result;
}

const MAX_WIDTH = 600;

function* getSrcsetWarnings(container: HTMLElementWithStyleSheets) {
    const images = getElements(container, 'img');
    const {length} = images;

    const result = [];

    for (let index = 0; index < length; index++) {
        const img = images[index] as HTMLImageElement;
        const sourceSet = img.getAttribute('srcset');
        const source = img.getAttribute('src');

        if (!sourceSet && source) {
            const isSVG = Boolean(source.endsWith('svg'));

            if (!isSVG) {
                const isLarge =
                    Number.parseInt(getComputedStyle(img).width, 10) >
                        MAX_WIDTH || img.naturalWidth > MAX_WIDTH;

                if (isLarge) {
                    result.push({
                        alt: img.alt,
                        path: getDomPath(img),
                        src: img.src,
                    });
                }
            }
        }
        yield index;
    }

    return result;
}

type SelectorRule = {rule: CSSRule; selector: string};

// Every rule with a selector, flattened once per scan instead of re-walking
// every stylesheet for every candidate element.
const getSelectorRules = (container: HTMLElementWithStyleSheets) => {
    const result: SelectorRule[] = [];

    forEachRule(container, (rule) => {
        // @ts-expect-error selectorText is untyped on the base CSSRule type
        const selectorText = rule.selectorText as string | undefined;

        if (selectorText) result.push({rule, selector: selectorText});
    });

    return result;
};

const responsiveBackgroundImgRegex =
    /-webkit-min-device-pixel-ratio|min-resolution|image-set/;

function* getBackgroundImageWarnings(
    rules: SelectorRule[],
    elements: Element[],
) {
    const backgroundImageRegex = /url\(".*?(.png|.jpg|.jpeg)"\)/;
    const elsWithBackgroundImage = elements.filter((element) => {
        const style = getComputedStyle(element);
        // @ts-expect-error kebab-case CSS property access via bracket notation
        // isn't in the CSSStyleDeclaration index type
        const backgroundImageStyle = style['background-image'];

        return (
            backgroundImageStyle &&
            backgroundImageRegex.test(backgroundImageStyle) &&
            // HACK
            // ideally, we would make a new image element and check its "naturalWidth"
            // to get a better idea of the size of the background image, this is a hack
            element.clientWidth > 200
        );
    });

    const {length} = elsWithBackgroundImage;
    const result = [];

    // Matching precomputed rules against elements is O(rules) per element;
    // doing that inside this per-element loop (instead of eagerly for every
    // candidate element up front) keeps each yielded step bounded to a
    // single element instead of the whole candidate list at once.
    for (let index = 0; index < length; index++) {
        const element = elsWithBackgroundImage[index];

        if (element) {
            const matchingRules = rules.filter(({selector}) =>
                safeMatches(element, selector),
            );

            const requiresResponsiveWarning = matchingRules.some(
                ({rule}) => !responsiveBackgroundImgRegex.test(rule.cssText),
            );

            if (requiresResponsiveWarning) {
                const bg = getComputedStyle(element).backgroundImage;
                const source = /url\("(.*)"\)/.test(bg)
                    ? bg.match(/url\("(.*)"\)/)?.[1]
                    : undefined;
                result.push({
                    path: getDomPath(element),
                    src: source,
                });
            }
        }
        yield index;
    }

    return result;
}

// Rules whose selector ends in `:active`, with the pseudo-class stripped so
// the remainder can be matched against elements directly. Derived from the
// already-computed `selectorRules` instead of re-scanning every stylesheet.
const activeRegex = /:active$/;

const getActiveRules = (selectorRules: SelectorRule[]) =>
    selectorRules
        .filter(({selector}) => activeRegex.test(selector))
        .map(({rule, selector}) => ({
            rule,
            selector: selector.replace(activeRegex, ''),
        }));

function* getActiveWarnings(
    activeRules: SelectorRule[],
    elements: HTMLElement[],
) {
    const {length} = elements;
    const result = [];

    for (let index = 0; index < length; index++) {
        const element = elements[index];

        if (element) {
            const hasActive = activeRules.some(({selector}) =>
                safeMatches(element, selector),
            );

            if (hasActive) {
                result.push({
                    html: element.innerHTML,
                    path: getDomPath(element),
                    text: element.textContent,
                    type: getNodeName(element),
                });
            }
        }
        yield index;
    }

    return result;
}

// Rules whose cssText mentions 100vh, derived from the already-computed
// `selectorRules` instead of re-scanning every stylesheet.
const get100vhRules = (selectorRules: SelectorRule[]) =>
    selectorRules.filter(({rule}) => /100vh/.test(rule.cssText));

function* get100vhWarnings(vhRules: SelectorRule[], elements: Element[]) {
    const {length} = elements;
    const result = [];

    for (let index = 0; index < length; index++) {
        const element = elements[index];

        if (element) {
            const match = vhRules.find(({selector}) =>
                safeMatches(element, selector),
            );

            if (match) {
                result.push({
                    css: match.rule.cssText,
                    el: element,
                    path: getDomPath(element),
                });
            }
        }
        yield index;
    }

    return result;
}

const schedule = (iterator: Iterator<unknown, unknown>): Analysis => {
    // 100ms is the threshold where users start to notice UI lag
    // higher values increase lag but do not noticeably improve processing time so 100ms is the sweet spot
    const scheduler = createScheduler({chunkBudget: 100});
    const task = scheduler.runTask(iterator);

    return {abort: () => scheduler.abortTask(task), task};
};

export const getScheduledWarnings = (
    container: HTMLElementWithStyleSheets,
    setState: Dispatch<SetStateAction<Warnings | undefined>>,
    setComplete: Dispatch<SetStateAction<boolean>>,
) => {
    const tappableElements = getTappableElements(container);
    const storyElements = getElements(container, '#storybook-root *');
    // Every stylesheet is walked once here instead of once per analysis:
    // active/height/backgroundImg all used to re-derive their own rule list
    // from a full forEachRule scan, tripling the up-front synchronous cost
    // each of their generators paid before their first yield.
    const selectorRules = getSelectorRules(container);
    const activeRules = getActiveRules(selectorRules);
    const vhRules = get100vhRules(selectorRules);

    const analyses: Record<string, Analysis> = {
        active: schedule(getActiveWarnings(activeRules, tappableElements)),
        backgroundImg: schedule(
            getBackgroundImageWarnings(selectorRules, storyElements),
        ),
        height: schedule(get100vhWarnings(vhRules, storyElements)),
        srcset: schedule(getSrcsetWarnings(container)),
        tapHighlight: schedule(getTapHighlightWarnings(tappableElements)),
        touchTarget: schedule(getTouchTargetSizeWarning(tappableElements)),
    };
    const analysesArray = Object.keys(analyses);
    let remaining = analysesArray.length;
    analysesArray.forEach((key) => {
        //const start = performance.now()
        analyses[key]?.task.then((result) => {
            //console.log(key, performance.now() - start)
            setState((prev) => ({...prev, [key]: result}));

            if (--remaining === 0) {
                setComplete(true);
            }
        });
    });

    return () => analysesArray.forEach((key) => analyses[key]?.abort());
};
