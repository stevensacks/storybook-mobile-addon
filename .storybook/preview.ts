import {definePreview} from '@storybook/react-vite';

export default definePreview({
    parameters: {
        backgrounds: {
            default: 'light',
        },
        actions: {argTypesRegex: '^on[A-Z].*'},
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
});
