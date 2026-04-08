import { library } from '@package/eslint-config';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';

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
  },
  {
    files: ['*.config.{ts,js,mjs}'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
]);
