import React, {Fragment} from 'react';
import type {FC} from 'react';
import {AddonPanel} from 'storybook/internal/components';
import Content from './Content';
import StateWrapper from './StateWrapper';
import ViewportManager from './ViewportManager';

type PanelProps = {
    active: boolean;
};

const Panel: FC<PanelProps> = ({active}) => (
    <Fragment key="storybook-mobile-addon">
        <ViewportManager active={active} />
        <AddonPanel active={active}>
            <StateWrapper>
                <Content active={active} />
            </StateWrapper>
        </AddonPanel>
    </Fragment>
);

export default Panel;
