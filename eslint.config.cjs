var jsdoc = require('eslint-plugin-jsdoc');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
    {
        languageOptions: {
            // Targeting older browsers.
            ecmaVersion: 5,
            sourceType: 'script'
        },
        ignores: ['node_modules/', 'dist/'], // Ignore common build folders
        rules: {
            // This library is implemented in UMD, but the preference
            // is to not indent within the UMD block.
            'indent': ['error', 4, {
            // TODO: @stylistic/indent
                'ignoredNodes': ['Program > ExpressionStatement > CallExpression > :last-child > *']
            }],
            // Single quotes.
            // TODO: @stylistic/quotes
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            // TODO: @stylistic/semi
            'semi': ['error', 'always'], // Enforce semicolons.
            // TODO: @stylistic/brace-style
            'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
            // TODO: @stylistic/object-curly-spacing
            'object-curly-spacing': ['error', 'always'],
            // TODO: @stylistic/key-spacing
            'key-spacing': ['error', { 'afterColon': true } ],
            // TODO: @stylistic/space-infix-ops
            'space-infix-ops': ['error', { 'int32Hint': false }],
            // TODO: @stylistic/comma-spacing
            'comma-spacing': ['error', { 'after': true }],

            'no-unused-vars': ['warn'],
            'no-console': 'off',
            'eqeqeq': ['error', 'always'], // Enforce ===
            'curly': ['error', 'multi-line'],
            'one-var': ['error', 'never']
        }
    },

    // https://www.npmjs.com/package/eslint-plugin-jsdoc
    jsdoc.configs['flat/recommended'],
    {
        settings: {
            'jsdoc': {
                'mode': 'typescript', // For templates and type "&" syntax.
                // Use `Object` for single and `Object<>` for multiple. That works in TS and Closure.
                'preferredTypes': { 'object': 'Object', 'object.<>': 'Object<>', 'Object.<>': 'Object<>', 'object<>': 'Object<>' }
            }
        },
        rules: {
            // Not all parameters need descriptions.
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-returns-description': 'off',
            // Define global types used.
            'jsdoc/no-undefined-types': ['warn', {
                // Essential data types.
                'definedTypes': ['Uint8Array', 'ArrayBuffer', 'DataView',
                    // Globals for TextEn/Decoder.
                    'TextDecoder', 'TextEncoder',
                    // Only used in test.js.
                    'Buffer', 'BufferEncoding'
                ]
            }],
            // ES6 defaults are not supported so this is NOT redundant
            'jsdoc/no-defaults': 'off',

            // Rules not enabled in recommended:
            'jsdoc/sort-tags': 'warn',
            'jsdoc/require-throws': 'warn',
            'jsdoc/require-template': 'warn',
            'jsdoc/check-template-names': 'warn',
            // Require hyphen before param descriptions but not before return description.
            'jsdoc/require-hyphen-before-param-description': ['warn', 'always', { 'tags': { 'returns': 'never' } }],
            'jsdoc/require-asterisk-prefix': 'warn',
            'jsdoc/require-asterisk-prefix': 'warn',
            'jsdoc/check-syntax': 'warn',
            'jsdoc/check-line-alignment': 'warn',
            'jsdoc/check-indentation': 'warn',
            'jsdoc/convert-to-jsdoc-comments': 'warn',
            'jsdoc/multiline-blocks': ['warn', {
                noMultilineBlocks: true,
                minimumLengthForMultiline: 80,
                multilineTags: []
            }]
        }
    },

   	{
        ignores: [
            // Defaults
            '**/dist/', // Common build output directory
            '**/*.min.js' // Minified JavaScript files
        ]
    }
];
