import js from '@eslint/js';
import globals from 'globals';
import pluginN from 'eslint-plugin-n';

const IndentSpaces = 4;

export default [
    js.configs.recommended,
    pluginN.configs['flat/recommended-module'],
    {
        files: [ '**/*.js' ],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node
            }
        },
        rules: {
            'array-bracket-spacing': [ 'error', 'always' ],
            'arrow-spacing': [ 'error', { before: true, after: true } ],
            'block-scoped-var': 'error',
            'brace-style': [ 'error', 'stroustrup' ],
            camelcase: 'error',
            'comma-spacing': [ 'error', { after: true } ],
            'comma-style': [ 'error', 'first' ],
            curly: 'warn',
            'default-case': 'error',
            'dot-location': [ 'error', 'property' ],
            'dot-notation': 'error',
            eqeqeq: [ 'error', 'smart' ],
            'func-call-spacing': [ 'error', 'never' ],
            indent: [
                'error',
                IndentSpaces,
                {
                    MemberExpression: 1,
                    ArrayExpression: 1,
                    ObjectExpression: 1
                }
            ],
            'keyword-spacing': [
                'error',
                {
                    overrides: {
                        if: { after: false },
                        for: { after: false },
                        while: { after: false }
                    }
                }
            ],
            'line-comment-position': [ 'error', { position: 'above' } ],
            'newline-per-chained-call': [ 'error', { ignoreChainWithDepth: 2 } ],
            'no-alert': 'error',
            'no-caller': 'error',
            'no-console': 'warn',
            'no-div-regex': 'error',
            'no-duplicate-imports': [ 'error', { includeExports: true } ],
            'no-else-return': [ 'error', { allowElseIf: false } ],
            'no-empty-function': 'error',
            'no-eq-null': 'error',
            'no-floating-decimal': 'error',
            'no-implicit-coercion': 'error',
            'no-irregular-whitespace': [ 'error', { skipComments: true } ],
            'no-lone-blocks': 'error',
            'no-lonely-if': 'error',
            'no-magic-numbers': [
                'error',
                {
                    ignore: [ 2, 1, 0, -1 ],
                    ignoreArrayIndexes: true
                }
            ],
            'no-multi-spaces': 'error',
            'no-param-reassign': [ 'error', { props: false } ],
            'no-trailing-spaces': 'error',
            'no-unneeded-ternary': 'error',
            'no-unsafe-negation': 'error',
            'no-unused-vars': [
                'error',
                {
                    args: 'all',
                    caughtErrors: 'all'
                }
            ],
            'no-useless-return': 'error',
            'no-var': 'error',
            'no-whitespace-before-property': 'error',
            'object-curly-spacing': [ 'error', 'always' ],
            'one-var': [
                'error',
                {
                    var: 'always',
                    let: 'never',
                    const: 'never'
                }
            ],
            'prefer-const': 'error',
            'prefer-destructuring': [
                'error',
                {
                    VariableDeclarator: {
                        array: false,
                        object: true
                    },
                    AssignmentExpression: {
                        array: true,
                        object: false
                    }
                },
                {
                    enforceForRenamedProperties: false
                }
            ],
            'prefer-template': 'error',
            quotes: [ 'error', 'single', { allowTemplateLiterals: true } ],
            semi: [ 'error', 'always', { omitLastInOneLineBlock: true } ],
            'space-before-blocks': [ 'error', 'always' ],
            'space-in-parens': [ 'error', 'never' ],
            'space-infix-ops': 'error',
            'space-unary-ops': [ 'error', { words: true, nonwords: false } ],
            'spaced-comment': [ 'error', 'always' ],
            yoda: 'error',

            'node/callback-return': 'warn',
            'node/global-require': 'warn',
            'node/no-deprecated-api': 'warn',
            'node/no-unpublished-import': 'off'
        }
    }
];