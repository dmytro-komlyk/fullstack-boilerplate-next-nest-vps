import { defineConfig } from 'eslint/config';
import { library } from '@package/eslint-config';
import tsParser from '@typescript-eslint/parser';

export default defineConfig([
  ...library,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['*.config.{ts,js,mjs}'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'tsup.config.ts'],
  },
]);
