/**
 * Script: refresh-auth.js
 *
 * Forces re-authentication for the active environment (dev or prod).
 * 1. Removes stale storage-state.{env}.json
 * 2. Launches Playwright auth-setup in headed mode for OTP entry
 *
 * Usage:
 *   cross-env TEST_ENV=dev node scripts/refresh-auth.js
 *   cross-env TEST_ENV=prod node scripts/refresh-auth.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const testEnv = (process.env.TEST_ENV || 'dev').toLowerCase().trim();
const isProd = testEnv === 'prod';
const authFileName = `storage-state.${testEnv}.json`;
const authFilePath = path.resolve(__dirname, '..', authFileName);

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log(`║     COUNT Auth Session Refresh: ${testEnv.toUpperCase().padEnd(20)}║`);
console.log('╚══════════════════════════════════════════════════════╝\n');

// Step 1: Remove existing session file if present
if (fs.existsSync(authFilePath)) {
  console.log(`🗑️  Removing existing session: ${authFileName}...`);
  fs.unlinkSync(authFilePath);
  console.log('✅ Old session removed.');
} else {
  console.log(`ℹ️  No existing session found for ${testEnv.toUpperCase()}. Starting fresh.`);
}

console.log('\n🌐 Launching headed browser for authentication...');
console.log('👉 When prompted for Security Check / OTP, enter the OTP in the browser.');
console.log('⏱️  You will have 2 minutes to complete the OTP.\n');

// Step 2: Run auth-setup project in headed mode
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npxCmd,
  ['playwright', 'test', '--project=auth-setup', '--headed'],
  {
    stdio: 'inherit',
    env: { ...process.env, TEST_ENV: testEnv },
    shell: true,
  }
);

if (result.status === 0) {
  console.log(`\n🎉 Success! New session saved to ${authFileName}`);
  console.log(`🚀 You can now run tests with: npm run test:${testEnv}`);
} else {
  console.error(`\n❌ Auth setup failed with exit code ${result.status}.`);
  console.error('   Please check the error output above and try again.');
  process.exit(result.status || 1);
}
