import React, {useEffect, useRef, useState} from 'react';
import type {FC} from 'react';
import Hints, {Loading} from './Hints';

type ContentProps = {
    active: boolean;
    storyId?: string;
};

const DELAY = 2000;

const getContainer = () => {
    const iframe = document.querySelector('#storybook-preview-iframe');
    if (!iframe) return null;

    // @ts-expect-error querySelector('#storybook-preview-iframe') is typed as
    // Element, which has no contentDocument
    return iframe.contentDocument;
};

const Content: FC<ContentProps> = ({active, storyId}) => {
    const [ready, setReady] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        // reset readiness when storyId changes
        setReady(false);

        const checkContainer = () => {
            const container = getContainer();

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            if (!container || !container.body) {
                timeoutRef.current = window.setTimeout(checkContainer, DELAY);
            } else {
                setReady(true);
            }
        };

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(checkContainer, DELAY);

        return () => clearTimeout(timeoutRef.current!);
    }, [storyId]);

    const container = getContainer();

    if (!active) return null;

    if (!ready || !container) {
        return <Loading />;
    }

    return <Hints container={container} />;
};

export default Content;
