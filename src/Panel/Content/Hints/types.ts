export type ActiveWarning = {
    html: string;
    path: string;
    text: string;
    type: string;
};

export type TapWarning = ActiveWarning;

export type SrcsetWarning = {
    alt?: string;
    path: string;
    src: string;
};

export type BackgroundImageWarning = SrcsetWarning;

export type ActiveStyleWarning = {};

export type AutoCompleteWarning = {
    labelText: string;
    path: string;
    type: string;
};

export type InputTypeWarning = AutoCompleteWarning;

export type InputTypeNumberWarning = AutoCompleteWarning;

export type HeightWarning = {
    css: string;
    el: HTMLElement;
    path: string;
};

export type MinSize = {height: number; width: number};

export type SuspectElementTuple = [HTMLElement, DOMRect];

export type SuspectElement = {
    bounding: MinSize;
    close: SuspectElementTuple[];
    el: HTMLElement;
};

export type DangerZone = {
    bottom: number;
    left: number;
    right: number;
    top: number;
};

export type TouchTarget = {
    close: SuspectElementTuple[];
    height: number;
    html: string;
    path: string;
    text: string;
    type: string;
    width: number;
};

export type TouchTargetWarning = {
    tooClose: TouchTarget[];
    underMinSize: TouchTarget[];
};

export type HTMLElementWithStyleSheets = HTMLElement & {
    styleSheets: Record<string, CSSStyleSheet>;
};

export type Analysis = {
    abort: () => void;
    task: Promise<unknown>;
};

export type Warnings = {
    active?: ActiveWarning[];
    autocomplete?: AutoCompleteWarning[];
    backgroundImg?: BackgroundImageWarning[];
    height?: HeightWarning[];
    inputType?: InputTypeWarning[];
    inputTypeNumber?: InputTypeNumberWarning[];
    srcset?: SrcsetWarning[];
    tapHighlight?: TapWarning[];
    touchTarget?: TouchTargetWarning;
};
