import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/domain/**/*.service.ts',
        'src/domain/**/*.helper.ts',
        'src/domain/**/*.queries.ts',
        'src/domain/**/*.commands.ts',
        'src/utils/**/*.ts',
        'src/config/env.ts',
      ],
    },
  },
});
