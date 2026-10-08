import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'allure-results/**',
      'allure-report/**',
      'reports/**',
      'scratch/**',
      'dist/**',
      'tests/scratch/**',
      'tests/scratchpad*/**',
      'tests/scratchpad*.ts',
    ],
  },
  tseslint.configs.base,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Critical error rules to catch silent test failure bugs
      'playwright/missing-playwright-await': 'error',
      'playwright/valid-expect': 'error',
      'playwright/no-focused-test': 'error',

      // Practical tuning for accounting app testing
      'playwright/expect-expect': 'off',
      'playwright/no-networkidle': 'off',
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-conditional-expect': 'warn',
      'playwright/no-force-option': 'warn',
      'playwright/no-wait-for-timeout': 'warn',
      'playwright/no-wait-for-selector': 'warn',
    },
  },
);
