import React, {FC, useEffect, useRef, useState} from 'react';
import Hints, {Loading} from './Hints';

type ContentProps = {
    active: boolean;
    storyId?: string;
};

const DELAY = 2000;

const getContainer = () => {
    const iframe = document.querySelector('#storybook-preview-iframe');
    if (!iframe) return null;

    // @ts-ignore
    return iframe.contentDocument;
};

const Content: FC<ContentProps> = ({active, storyId}) => {
    const [html, setHTML] = useState(undefined);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        // clear HTML when storyId changes
        setHTML(undefined);

        const checkContainer = () => {
            const container = getContainer();

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            if (!container || !container.body) {
                timeoutRef.current = window.setTimeout(checkContainer, DELAY);
            } else {
                setHTML(container.body.innerHTML);
            }
        };

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(checkContainer, DELAY);

        return () => clearTimeout(timeoutRef.current);
    }, [storyId]);

    const container = getContainer();

    if (!active) return null;

    if (!html || !container) {
        return <Loading />;
    }

    return <Hints container={container} />;
};

export default Content;
