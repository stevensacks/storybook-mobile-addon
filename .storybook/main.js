module.exports = {
    addons: ['../preset.js', '@storybook/addon-essentials'],
    stories: [
        '../stories/**/*.stories.mdx',
        '../stories/**/*.stories.@(js|jsx|ts|tsx)',
    ],
};
