module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**', 'uploads/**', 'postman/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^next$' }],
      'no-console': 'error',
      eqeqeq: 'error',
      curly: ['error', 'all']
    }
  },
  { rules: { 'no-unexpected-multiline': 'error' } }
];
