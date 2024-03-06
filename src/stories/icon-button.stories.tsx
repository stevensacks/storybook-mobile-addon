import React from 'react';
import {InfoSignIcon} from 'evergreen-ui';
import {styled} from '@storybook/theming';

const InvisibleButton = styled.button`
    font-family: inherit;
    color: inherit;
    cursor: pointer;
    border: none;
    font-size: 100%;
    background-color: transparent;
    appearance: none;
    box-shadow: none;
    margin: 1rem;
    -webkit-tap-highlight-color: hsla(0, 0%, 0%, 0);
`;

const IconButton = () => (
    <InvisibleButton>
        {/* @ts-ignore */}
        <InfoSignIcon color="info" />
    </InvisibleButton>
);

export const Default = () => <IconButton />;

export default {
    component: IconButton,
    title: 'Icon Button',
};
