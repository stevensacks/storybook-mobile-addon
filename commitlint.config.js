module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'body-leading-blank': [2, 'always'],
        'scope-case': [
            2,
            'always',
            ['lower-case', 'camel-case', 'pascal-case'],
        ],
        'type-enum': [
            2,
            'always',
            [
                'build',
                'chore',
                'ci',
                'feat',
                'fix',
                'docs',
                'merge',
                'refactor',
                'revert',
                'story',
                'style',
                'test',
            ],
        ],
    },
};
