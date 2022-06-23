const IndentSpaces = 4;
module.exports = {
    parserOptions: {
        sourceType: 'script'
        , ecmaFeatures: {
            impliedStrict: true
        }
    }
    , extends: 'eslint:recommended'
    , env: {
        node: true
        , mocha: true
        , es2020: true
    }
    , rules: {
        'array-bracket-spacing': [ 'error', 'always' ]
        , 'arrow-spacing': [ 'error', { 'before': true, 'after': true } ]
        , 'block-scoped-var': 'error'
        , 'brace-style': [ 'error', 'stroustrup' ]
        , 'callback-return': 'error'
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
        , 'no-const-assign': 'error'
        , 'no-div-regex': 'error'
        , 'no-dupe-args': 'error'
        , 'no-dupe-class-members': 'error'
        , 'no-duplicate-imports': [ 'error', { includeExports: true } ]
        , 'no-else-return': [ 'error', { allowElseIf: false } ]
        , 'no-empty-function': 'error'
        , 'no-eq-null': 'error'
        , 'no-extra-boolean-cast': [ 'error' ]
        , 'no-extra-semi': [ 'error' ]
        , 'no-fallthrough': [ 'warn' ]
        , 'no-floating-decimal': 'error'
        , 'no-func-assign': [ 'error' ]
        , 'no-implicit-coercion': [ 'error' ]
        , 'no-inner-declarations': 'error'
        , 'no-invalid-regexp': [ 'error' ]
        , 'no-lone-blocks': [ 'error' ]
        , 'no-lonely-if': 'error'
        , 'no-magic-numbers': [ 'error', { ignore: [ 1, 0, -1 ], ignoreArrayIndexes: true } ]
        , 'no-multi-spaces': 'error'
        , 'no-param-reassign': [ 'error', { props: false } ]
        , 'no-irregular-whitespace': [ 'error', { skipComments: true } ]
        , 'no-path-concat': 'error'
        , 'no-process-env': 'warn'
        , 'no-redeclare': 'error'
        , 'no-regex-spaces': [ 'error' ]
        , 'no-return-await': 'error'
        , 'no-script-url': 'error'
        , 'no-self-assign': 'error'
        , 'no-self-compare': [ 'error' ]
        , 'no-tabs': 'error'
        , 'no-trailing-spaces': 'error'
        , 'no-unneeded-ternary': [ 'error' ]
        , 'no-unreachable': 'error'
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
        , 'use-isnan': [ 'error' ]
        , 'valid-typeof': [ 'error' ]
        , yoda: 'error',
    }
};
