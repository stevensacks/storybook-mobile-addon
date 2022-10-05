// Supports both JavaScript and TypeScript
// shared plugins, extends, and rules
const shared = {
  plugins: [
    'simple-import-sort',
    'sort-destructure-keys',
    'react',
    'sort-keys-fix',
    'sort-react-dependency-arrays',
    'no-switch-statements',
    'you-dont-need-lodash-underscore',
    'sonarjs',
    'unicorn',
    'prefer-arrow',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:storybook/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:sonarjs/recommended',
    'plugin:unicorn/recommended',
    'plugin:no-switch-statements/recommended',
    'prettier',
  ],
  rules: {
    'arrow-body-style': ['error', 'as-needed'],
    'prefer-arrow-callback': 'off',
    complexity: 'off',
    'consistent-return': 'off',
    'function-paren-newline': 'off',
    'implicit-arrow-newline': 'off',
    'import/no-anonymous-default-export': [
      'error',
      {
        allowArray: true,
        allowLiteral: true,
        allowObject: true,
      },
    ],
    'import/order': 'off',
    'sort-imports': 'off',
    'simple-import-sort/imports': [
      'error',
      {
        groups: [['^react', '^@?\\w', '^\\.', '^[^.]', '^\\u0000']],
      },
    ],
    'simple-import-sort/exports': 'error',
    'import/prefer-default-export': 'error',
    'import/no-named-as-default': 'off',
    'import/extensions': 'off',
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['to'],
      },
    ],
    'jsx-a11y/label-has-for': 'off',
    'no-lonely-if': ['error'],
    'no-nested-ternary': 'off',
    'no-return-assign': ['error'],
    'no-unused-vars': 'off',
    'max-params': ['error', 3],
    'padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        prev: '*',
        next: ['block-like', 'export', 'return'],
      },
    ],
    'prefer-object-spread': ['error'],
    'prefer-spread': 'off',
    'spaced-comment': 'off',
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: false,
      },
    ],
    'eslint-comments/disable-enable-pair': 'off',
    'eslint-comments/no-unused-disable': 'error',
    'react/boolean-prop-naming': [
      'error',
      {
        propTypeNames: ['bool', 'mutuallyExclusiveTrueProps'],
        rule: '^((is|has|can|show|hide)[A-Z]([A-Za-z0-9]?)+|(show|hide|disabled|required|active|step|checked))',
      },
    ],
    'react/button-has-type': 'off',
    'react/require-default-props': 'off',
    'react/jsx-boolean-value': ['error', 'always'],
    'react/jsx-filename-extension': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/prefer-stateless-function': ['error'],
    'react/function-component-definition': 'off',
    'react/prop-types': 'off',
    'react/jsx-newline': ['error', {prevent: true}],
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-sort-props': [
      'error',
      {
        ignoreCase: false,
        reservedFirst: true,
      },
    ],
    'sort-destructure-keys/sort-destructure-keys': 'error',
    'sort-keys': [
      'error',
      'asc',
      {caseSensitive: true, natural: true, minKeys: 2},
    ],
    'sort-keys-fix/sort-keys-fix': 'warn',
    'prefer-arrow/prefer-arrow-functions': [
      'error',
      {
        disallowPrototype: true,
        singleReturnOnly: false,
        classPropertiesAllowed: false,
      },
    ],
    'sonarjs/cognitive-complexity': 'off',
    'sonarjs/no-duplicate-string': 'off',
    'sonarjs/no-inverted-boolean-check': 'error',
    'unicorn/no-array-for-each': 'off',
    'unicorn/new-for-builtins': 'off',
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/no-null': 'off',
    'unicorn/no-useless-undefined': 'off',
    'unicorn/prefer-export-from': 'off',
    'unicorn/prefer-set-has': 'off',
    'unicorn/prefer-spread': 'off',
    'unicorn/prefer-switch': 'off',
    'unicorn/prefer-ternary': 'off',
    'unicorn/prevent-abbreviations': [
      'error',
      {
        ignore: [
          'acc',
          'args',
          'ctx',
          'fn',
          'obj',
          'prev',
          'req',
          'res',
          /args/i,
          /params/i,
          /props/i,
          /ref/i,
          /utils/i,
        ],
      },
    ],
    'unicorn/template-indent': 'off',

    'sort-react-dependency-arrays/sort': 'error',

    'prettier/prettier': ['error'],
  },
};

module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
  },
  settings: {
    'import/resolver': {
      node: {
        paths: ['src'],
      },
    },
    react: {
      pragma: 'React',
      version: 'detect',
    },
  },
  plugins: shared.plugins,
  extends: ['airbnb', ...shared.extends],
  rules: shared.rules,
  ignorePatterns: ['node_modules', '*.config.js'],
  overrides: [
    {
      files: ['**/*.ts?(x)'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
      },
      extends: [
        'airbnb',
        'airbnb-typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:typescript-sort-keys/recommended',
        ...shared.extends,
      ],
      plugins: [
        ...shared.plugins,
        '@typescript-eslint',
        'typescript-sort-keys',
      ],
      rules: {
        ...shared.rules,
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': [
          'error',
        ],
        '@typescript-eslint/no-unused-vars': 'error',
      },
    },
    {
      files: ['*.stories.js?(x)', 'stories/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/extensions': 'off',
        'react/jsx-props-no-spreading': 'off',
        'sonarjs/no-identical-functions': 'off',
      },
    },
    {
      files: ['*.tsx'],
      rules: {
        'unicorn/filename-case': ['error', {case: 'camelCase'}],
      },
    },
    {
      files: ['.storybook/**/*.js?(x)'],
      rules: {
        'global-require': 'off',
        'no-param-reassign': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'off',
        'unicorn/prefer-module': 'off',
        'unicorn/prefer-node-protocol': 'off',
      },
    }
  ],
};

