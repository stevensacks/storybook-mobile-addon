import {cloneElement, FC, ReactElement, useState} from 'react';
import {useChannel} from 'storybook/manager-api';
import {STORY_RENDERED} from 'storybook/internal/core-events';

type StateWrapperProps = {
    children: ReactElement;
};

const StateWrapper: FC<StateWrapperProps> = ({children}) => {
    const [storyId, setStoryId] = useState('');

    useChannel({
        [STORY_RENDERED]: (...args) => {
            setStoryId(String(args));
        },
    });

    return cloneElement(children, {storyId});
};

export default StateWrapper;
