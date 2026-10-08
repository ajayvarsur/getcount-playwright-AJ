import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { ENV } from './src/utils/env';

// Disable terminal title updates to prevent stdout corruption
process.env.PLAYWRIGHT_DISABLE_TERMINAL_TITLE = '1';

// ── Dynamic Auth State Detection ──────────────────────────────────
// Automatically detect if an environment-specific saved session exists:
// - storage-state.dev.json for dev
// - storage-state.prod.json for prod
const authFile = ENV.AUTH_FILE;
const authFilePath = path.resolve(__dirname, authFile);
const hasAuth = fs.existsSync(authFilePath);

// In production, default to running only @prod-safe tests to prevent accidental data creation
const prodGrep = ENV.IS_PROD && !process.env.RUN_ALL_PROD ? /@prod-safe/ : undefined;

/**
 * Playwright Configuration for COUNT Automation Framework
 * Supports dual environments: DEV and PRODUCTION
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Ignore scratch investigation scripts from standard test runs
  testIgnore: [
    '**/scratch/**',
    '**/tests/scratch/**',
    '**/test-random-customer.spec.ts',
    '**/scratchpad_*.spec.ts',
  ],

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry: prod gets retries for network latency, dev configurable
  retries: process.env.CI ? 2 : ENV.RETRIES,

  // Parallel workers - Set to 1 to avoid auth session collision on single accounts
  workers: ENV.WORKERS,


  // Reporter configuration
  reporter: process.env.GITHUB_ACTIONS
    ? [
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['github'],
      ]
    : [
        ['html', { open: 'on-failure', outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['dot'],
        ['allure-playwright', { outputFolder: 'allure-results' }],
      ],

  // Global setup and teardown
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  // Shared settings for all projects
  use: {
    // Base URL for all tests (dev-app.getcount.com or app.getcount.com)
    baseURL: ENV.BASE_URL,

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Record trace on every run for debugging
    trace: 'on',

    // Record video on first retry
    video: 'on-first-retry',

    // Default navigation timeout
    navigationTimeout: 30_000,

    // Default action timeout
    actionTimeout: 25_000,

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },

    // Viewport size — 1280x720 for all tests
    viewport: { width: 1280, height: 720 },
  },

  // Output directory for test artifacts (screenshots, videos, traces)
  outputDir: 'test-results/artifacts',

  // Test timeout
  timeout: 60_000,

  // Expect timeout
  expect: {
    timeout: 15_000,
  },

  // Configure projects for major browsers
  projects: [
    // ── Auth Setup Project ──────────────────────────────────────
    // Runs ONLY when storage-state.{env}.json doesn't exist.
    // Performs login + OTP + workspace selection, then saves the session.
    // Can also be run manually: npm run auth:dev or npm run auth:prod
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      testDir: './src/setup',
      // Never auto-retry auth setup because it requires manual OTP entry
      retries: 0,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // The auth-setup project must ALWAYS start with a clean browser context
        storageState: undefined,
      },
    },

    // ── Main Test Project ───────────────────────────────────────
    // Automatically depends on auth-setup if no saved session exists for the active environment.
    {
      name: 'chromium',
      // In production, only run @prod-safe tests unless explicitly overridden
      grep: prodGrep,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Automatically use saved session if it exists
        ...(hasAuth ? { storageState: authFile } : {}),
      },
      // Automatically run auth-setup first if session doesn't exist
      dependencies: hasAuth ? [] : ['auth-setup'],
    },
  ],
});
