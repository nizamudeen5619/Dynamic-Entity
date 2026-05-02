module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
  },
  overrides: [
    {
      // TypeScript packages
      files: ['packages/core/**/*.ts', 'packages/ngx-dynamic-entity/**/*.ts'],
      parser: '@typescript-eslint/parser',
      extends: ['eslint:recommended'],
      rules: {
        'no-unused-vars': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '*.js.map'],
};
