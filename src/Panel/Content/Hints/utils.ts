/* eslint-disable no-plusplus */
import {Dispatch, SetStateAction} from 'react';
import {createScheduler} from 'lrt';
import getDomPath from './get-dom-path';
import {
    Analysis,
    DangerZone,
    HTMLElementWithStyleSheets,
    MinSize,
    SuspectElement,
    SuspectElementTuple,
    TouchTarget,
    Warnings,
} from './types';

const getElements = (container: HTMLElementWithStyleSheets, tag: string) =>
    Array.from(container.querySelectorAll(tag));

const getStylesheetRules = (
    sheets: Record<string, CSSStyleSheet>,
    k: string
) => {
    let rules: CSSRule[] = [];

    try {
        rules = Array.from(sheets[k].cssRules);
    } catch {
        //
    }

    return rules;
};

const getNodeName = (element: Element) =>
    element.nodeName === 'A'
        ? 'a'
        : element.nodeName === 'BUTTON'
        ? 'button'
        : `${element.nodeName.toLowerCase()}[role="button"]`;

const attachLabels = (
    inputs: HTMLInputElement[],
    container: HTMLElementWithStyleSheets
) =>
    inputs.map((input) => {
        let labelText = '';

        if (input.labels && input.labels[0]) {
            labelText = input.labels[0].textContent;
        } else if (input.parentElement.nodeName === 'LABEL') {
            labelText = input.parentElement.textContent;
        } else if (input.id) {
            const label = container.querySelector(`label[for="${input.id}"]`);
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

        return textInputs[currentType] && !autocomplete;
    }) as HTMLInputElement[];

    return attachLabels(warnings, container);
};

const getInputTypeNumberWarnings = (container: HTMLElementWithStyleSheets) => {
    const inputs = getElements(
        container,
        'input[type="number"]'
    ) as HTMLInputElement[];

    return attachLabels(inputs, container);
};

const getInputTypeWarnings = (container: HTMLElementWithStyleSheets) => {
    const inputs = getElements(container, 'input[type="text"]')
        .concat(getElements(container, 'input:not([type])'))
        .filter(
            (input) => !input.getAttribute('inputmode')
        ) as HTMLInputElement[];

    return attachLabels(inputs, container);
};

export const getInstantWarnings = (
    container: HTMLElementWithStyleSheets
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

const toTouchTarget = ({
    bounding: {height, width},
    close,
    el,
}: SuspectElement): TouchTarget => ({
    close,
    height: Math.floor(height),
    html: el.innerHTML,
    path: getDomPath(el),
    text: el.textContent,
    type:
        el.nodeName === 'A'
            ? 'a'
            : el.nodeName === 'BUTTON'
            ? 'button'
            : `${el.nodeName.toLowerCase()}[role="button"]`,
    width: Math.floor(width),
});

export const MIN_SIZE = 32;

export const RECOMMENDED_DISTANCE = 8;
//const RECOMMENDED_SIZE = 48

const checkMinSize = ({height, width}: MinSize) =>
    height < MIN_SIZE || width < MIN_SIZE;

function* getTouchTargetSizeWarning(container: HTMLElementWithStyleSheets) {
    const elements = getElements(container, 'button')
        .concat(getElements(container, '[role="button"]'))
        .concat(getElements(container, 'a')) as HTMLElement[];

    const suspectElements = Array.from(new Set(elements)).map(
        (element): SuspectElementTuple => [
            element,
            element.getBoundingClientRect(),
        ]
    );

    const {length} = elements;
    const underMinSize = [];
    const tooClose = [];

    for (let index = 0; index < length; index++) {
        const element = elements[index];
        const bounding = element.getBoundingClientRect();

        const dangerZone = {
            bottom: bounding.bottom + RECOMMENDED_DISTANCE,
            left: bounding.left - RECOMMENDED_DISTANCE,
            right: bounding.right + RECOMMENDED_DISTANCE,
            top: bounding.top - RECOMMENDED_DISTANCE,
        };

        const close = suspectElements.filter(
            ([susElement, susBounding]) =>
                susElement !== element &&
                isInside(dangerZone, susBounding as DOMRect)
        );

        const isUnderMinSize = checkMinSize(bounding);

        if (isUnderMinSize || close.length > 0) {
            const touchTarget = toTouchTarget({bounding, close, el: element});

            if (isUnderMinSize) {
                underMinSize.push(touchTarget);
            }

            if (close.length > 0) {
                tooClose.push(touchTarget);
            }
        }
        yield index;
    }

    return {tooClose, underMinSize};
}

function* getTapHighlightWarnings(container: HTMLElementWithStyleSheets) {
    const buttons = getElements(container, 'button').concat(
        getElements(container, '[role="button"]')
    );
    const links = getElements(container, 'a');
    const elements = buttons.concat(links);
    const {length} = elements;

    const result = [];

    for (let index = 0; index < length; index++) {
        const element = elements[index] as HTMLElement;

        if (
            // @ts-ignore
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

function* getBackgroundImageWarnings(container: HTMLElementWithStyleSheets) {
    const backgroundImageRegex = /url\(".*?(.png|.jpg|.jpeg)"\)/;
    const elsWithBackgroundImage = getElements(container, '#root *').filter(
        (element) => {
            const style = getComputedStyle(element);
            // @ts-ignore
            const backgroundImageStyle = style['background-image'];

            return (
                backgroundImageStyle &&
                backgroundImageRegex.test(backgroundImageStyle) &&
                // HACK
                // ideally, we would make a new image element and check its "naturalWidth"
                // to get a better idea of the size of the background image, this is a hack
                element.clientWidth > 200
            );
        }
    );

    if (elsWithBackgroundImage.length === 0) return [];

    const styleDict = new Map();

    Object.keys(container.styleSheets).forEach((k) => {
        getStylesheetRules(container.styleSheets, k).forEach((rule) => {
            if (rule) {
                try {
                    elsWithBackgroundImage.forEach((element) => {
                        // @ts-ignore
                        if (element.matches(rule.selectorText)) {
                            styleDict.set(
                                element,
                                (styleDict.get(element) || []).concat(rule)
                            );
                        }
                    });
                } catch {
                    // catch errors in safari
                }
            }
        });
    });

    const responsiveBackgroundImgRegex =
        /-webkit-min-device-pixel-ratio|min-resolution|image-set/;

    const result = [];
    const elements = Array.from(styleDict.entries());
    const {length} = elements;

    for (let index = 0; index < length; index++) {
        const [element, styles] = elements[index];

        if (styles) {
            const requiresResponsiveWarning = styles.some(
                (style: string) => !responsiveBackgroundImgRegex.test(style)
            );

            if (requiresResponsiveWarning) {
                const bg = getComputedStyle(element).backgroundImage;
                const source = /url\("(.*)"\)/.test(bg)
                    ? bg.match(/url\("(.*)"\)/)[1]
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

export const getActiveStyles = (
    container: HTMLElementWithStyleSheets,
    element: Element
) => {
    const sheets = container.styleSheets;
    const result: CSSRule[] = [];

    const activeRegex = /:active$/;

    Object.keys(sheets).forEach((k) => {
        getStylesheetRules(sheets, k).forEach((rule) => {
            if (
                rule &&
                // @ts-ignore
                rule.selectorText &&
                // @ts-ignore
                activeRegex.test(rule.selectorText)
            ) {
                // @ts-ignore
                const ruleNoPseudoClass = rule.selectorText.replace(
                    activeRegex,
                    ''
                );

                try {
                    if (element.matches(ruleNoPseudoClass)) {
                        result.push(rule);
                    }
                } catch {
                    // safari
                }
            }
        });
    });

    return result;
};

function* getActiveWarnings(container: HTMLElementWithStyleSheets) {
    const buttons = getElements(container, 'button').concat(
        getElements(container, '[role="button"]')
    );
    const links = getElements(container, 'a');
    const elements = buttons.concat(links);
    const {length} = elements;
    const result = [];

    for (let index = 0; index < length; index++) {
        const element = elements[index];
        const hasActive = getActiveStyles(container, element);

        if (hasActive.length > 0) {
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

export const getOriginalStyles = (
    container: HTMLElementWithStyleSheets,
    element: Element
) => {
    const sheets = container.styleSheets;
    const result: string[] = [];

    Object.keys(sheets).forEach((k) => {
        const rules = getStylesheetRules(sheets, k);
        rules.forEach((rule) => {
            if (rule) {
                try {
                    // @ts-ignore
                    if (element.matches(rule.selectorText)) {
                        result.push(rule.cssText);
                    }
                } catch {
                    // catch errors in safari
                }
            }
        });
    });

    return result;
};

function* get100vhWarnings(container: HTMLElementWithStyleSheets) {
    const elements = getElements(container, '#root *');
    const {length} = elements;
    const result = [];

    for (let index = 0; index < length; index++) {
        const element = elements[index];
        const styles = getOriginalStyles(container, element);
        const vhWarning = styles.find((style) => /100vh/.test(style));

        if (vhWarning) {
            result.push({
                css: vhWarning,
                el: element,
                path: getDomPath(element),
            });
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
    setState: Dispatch<SetStateAction<Warnings>>,
    setComplete: Dispatch<SetStateAction<boolean>>
) => {
    const analyses: Record<string, Analysis> = {
        active: schedule(getActiveWarnings(container)),
        backgroundImg: schedule(getBackgroundImageWarnings(container)),
        height: schedule(get100vhWarnings(container)),
        srcset: schedule(getSrcsetWarnings(container)),
        tapHighlight: schedule(getTapHighlightWarnings(container)),
        touchTarget: schedule(getTouchTargetSizeWarning(container)),
    };
    const analysesArray = Object.keys(analyses);
    let remaining = analysesArray.length;
    analysesArray.forEach((key) => {
        //const start = performance.now()
        analyses[key].task.then((result) => {
            //console.log(key, performance.now() - start)
            setState((prev) => ({...prev, [key]: result}));

            if (--remaining === 0) {
                setComplete(true);
            }
        });
    });

    return () => analysesArray.forEach((key) => analyses[key].abort());
};
