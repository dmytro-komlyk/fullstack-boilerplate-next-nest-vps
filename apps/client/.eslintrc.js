module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals', '@repo/eslint-config/next.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: true,
  },
};
