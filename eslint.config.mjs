import pluginJs from '@eslint/js';
import globals from 'globals';
const IndentSpaces = 4;

export default [
    pluginJs.configs.recommended
    , {
        files: [ '**/*.mjs' ]
        , languageOptions: {
            ecmaVersion: 2020
            , globals: {
                ...globals.es2020
                , ...globals.node
                , ...globals.mocha
                , console: true
                , process: true
            }
        }
        , linterOptions : {
            noInlineConfig: false
        }
        , plugins: {
            pluginJs
        }
        , rules: {
            'array-bracket-spacing': [ 'error', 'always' ]
            , 'arrow-spacing': [ 'error', { 'before': true, 'after': true } ]
            , 'block-scoped-var': 'error'
            , 'brace-style': [ 'error', 'stroustrup' ]
            , 'camelcase': 'error'
            , 'comma-spacing': [ 'error', { 'after': true } ]
            , 'comma-style': [ 'error', 'first' ]
            , 'curly': [ 'warn' ]
            , 'default-case': 'error'
            , 'dot-location': [ 'error', 'property' ]
            , 'dot-notation': [ 'error' ]
            , 'eqeqeq': [ 'error', 'smart' ]
            , 'func-call-spacing': [ 'error', 'never' ]
            , 'handle-callback-err': 'error'
            , 'indent': [ 'error', IndentSpaces, { 'MemberExpression': 1, 'ArrayExpression': 1, 'ObjectExpression': 1 } ]
            , 'keyword-spacing': [ 'error', { 'overrides': { 'if': { 'after': false }, 'for': { 'after': false }, 'while': { 'after': false } } } ]
            , 'line-comment-position': [ 'error', { 'position': 'above' } ]
            , 'newline-per-chained-call': [ 'error', { 'ignoreChainWithDepth': 2 } ]
            , 'no-alert': [ 'error' ]
            , 'no-caller': 'error'
            , 'no-console': 'warn'
            , 'no-div-regex': 'error'
            , 'no-duplicate-imports': [ 'error', { includeExports: true } ]
            , 'no-else-return': [ 'error', { allowElseIf: false } ]
            , 'no-empty-function': 'error'
            , 'no-eq-null': 'error'
            , 'no-floating-decimal': 'error'
            , 'no-implicit-coercion': [ 'error' ]
            , 'no-irregular-whitespace': [ 'error', { skipComments: true } ]
            , 'no-lone-blocks': [ 'error' ]
            , 'no-lonely-if': 'error'
            , 'no-magic-numbers': [ 'error', { ignore: [ 2, 1, 0, -1 ], ignoreArrayIndexes: true } ]
            , 'no-multi-spaces': 'error'
            , 'no-param-reassign': [ 'error', { props: false } ]
            , 'no-path-concat': 'error'
            , 'no-return-await': 'error'
            , 'no-script-url': 'error'
            , 'no-self-compare': [ 'error' ]
            , 'no-tabs': 'error'
            , 'no-trailing-spaces': 'error'
            , 'no-unneeded-ternary': [ 'error' ]
            , 'no-unsafe-negation': [ 'error' ]
            , 'no-unused-vars': [ 'error', { args: 'all', caughtErrors: 'all' } ]
            , 'no-useless-return': 'error'
            , 'no-var': 'error'
            , 'no-whitespace-before-property': 'error'
            , 'object-curly-spacing': [ 'error', 'always' ]
            , 'one-var': [ 'error', { var: 'always', let: 'never', const: 'never' } ]
            , 'prefer-const': 'error'
            , 'prefer-destructuring': [
                'error'
                , {
                    VariableDeclarator: {
                        array: false
                        , object: true,
                    }
                    , AssignmentExpression: {
                        array: true
                        , object: false,
                    },
                }
                , {
                    enforceForRenamedProperties: false,
                }
                , ]
            , 'prefer-template': 'error'
            , quotes: [ 'error', 'single', { allowTemplateLiterals: true } ]
            , semi: [ 'error', 'always', { omitLastInOneLineBlock: true } ]
            , 'space-before-blocks': [ 'error', 'always' ]
            , 'space-in-parens': [ 'error', 'never' ]
            , 'space-infix-ops': [ 'error' ]
            , 'space-unary-ops': [ 'error', { words: true, nonwords: false } ]
            , 'spaced-comment': [ 'error', 'always' ]
            , yoda: 'error'
        }
    }
];
