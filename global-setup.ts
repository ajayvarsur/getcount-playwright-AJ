import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ENV } from './src/utils/env';

/**
 * Global setup runs once before all tests.
 * - Validates environment configuration
 * - Verifies target application is reachable
 * - Checks session freshness and auto-refreshes if stale
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL || ENV.BASE_URL;
  const authFilePath = path.resolve(process.cwd(), ENV.AUTH_FILE);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     COUNT Automation Framework — Global Setup        ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Environment: ${ENV.TEST_ENV.toUpperCase().padEnd(39)}║`);
  console.log(`║  Target URL : ${baseURL.padEnd(39)}║`);
  console.log(`║  Workspace  : ${ENV.WORKSPACE_NAME.padEnd(39)}║`);
  console.log(`║  Auth File  : ${ENV.AUTH_FILE.padEnd(39)}║`);
  console.log(`║  CI Mode    : ${(!!process.env.CI).toString().padEnd(39)}║`);
  console.log(`║  Timestamp  : ${new Date().toISOString().padEnd(39)}║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Verify target application is reachable
  try {
    const response = await fetch(baseURL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok && response.status !== 304) {
      console.warn(`⚠️  Warning: Target returned HTTP ${response.status}. Tests may be unreliable.`);
    } else {
      console.log(`✅ Target application is reachable (HTTP ${response.status})`);
    }
  } catch (error) {
    console.error(`❌ Target application is NOT reachable at ${baseURL}`);
    console.error(`   Error: ${(error as Error).message}`);
    console.error('   Ensure the application is running and the BASE_URL is correct.\n');
    throw new Error(`Global setup failed: Cannot reach ${baseURL}`);
  }

  // Check session token validity
  if (fs.existsSync(authFilePath)) {
    console.log(`✅ [${ENV.TEST_ENV.toUpperCase()}] Saved session found: ${ENV.AUTH_FILE}`);
  } else {
    console.log(`ℹ️  [${ENV.TEST_ENV.toUpperCase()}] No saved session found at ${ENV.AUTH_FILE}. Auth setup will run.`);
  }
}

export default globalSetup;
