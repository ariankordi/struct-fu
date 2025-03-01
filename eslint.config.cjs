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
            'indent': ['error', 4, { 'ignoredNodes': ['Program > ExpressionStatement > CallExpression > :last-child > *'] }],
            // Single quotes.
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            'semi': ['error', 'always'], // Enforce semicolons.
            'no-unused-vars': ['warn'],
            'no-console': 'off',
            'eqeqeq': ['error', 'always'], // Enforce ===
            'curly': ['error', 'multi-line'],
            'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
            'object-curly-spacing': ['error', 'always'],
            'key-spacing': ['error', { 'afterColon': true } ],
            'space-infix-ops': ['error', { 'int32Hint': false }],
            'comma-spacing': ['error', { 'after': true }]
        }
    }
];
