import {FC, useEffect, useRef} from 'react';
import {useAddonState} from '@storybook/manager-api';
import {DEFAULT_VIEWPORT, NO_VIEWPORT, VIEWPORT_ID} from '../../constants';

type ViewportManagerProps = {
    active: boolean;
};

const ViewportManager: FC<ViewportManagerProps> = ({active}) => {
    const [viewportState, setViewportState] = useAddonState(VIEWPORT_ID);
    const cachedState = useRef(null);

    useEffect(() => {
        if (cachedState.current && !active) {
            setViewportState({
                selected: cachedState.current,
            });
            cachedState.current = null;
        } else if (
            active &&
            // @ts-ignore
            (!viewportState || viewportState.selected === NO_VIEWPORT)
        ) {
            cachedState.current = NO_VIEWPORT;
            setViewportState({
                selected: DEFAULT_VIEWPORT,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    return null;
};

export default ViewportManager;
