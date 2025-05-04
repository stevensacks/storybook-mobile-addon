import React from 'react';
import {addons, types} from 'storybook/manager-api';
import {ADDON_ID, PANEL_ID, PARAM_KEY} from './constants';
import Panel from './Panel';

addons.register(ADDON_ID, () => {
    addons.add(PANEL_ID, {
        match: ({viewMode}) => !!viewMode?.match(/^story$/),
        paramKey: PARAM_KEY,
        render: ({active}) => <Panel active={active} />,
        title: 'Mobile',
        type: types.PANEL,
    });
});
