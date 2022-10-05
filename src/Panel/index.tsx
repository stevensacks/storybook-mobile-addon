import React, {FC, Fragment} from 'react';
import {AddonPanel} from '@storybook/components';
import Content from './Content';
import StateWrapper from './StateWrapper';
import ViewportManager from './ViewportManager';

type PanelProps = {
    active: boolean;
    panelKey: string;
};

const Panel: FC<PanelProps> = ({active, panelKey}) => (
    <Fragment key="storybook-mobile-addon">
        <ViewportManager active={active} />
        <AddonPanel key={panelKey} active={active}>
            <StateWrapper>
                <Content key={panelKey} active={active} />
            </StateWrapper>
        </AddonPanel>
    </Fragment>
);

export default Panel;
