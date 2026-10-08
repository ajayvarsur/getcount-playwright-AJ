/**
 * Script: export-auth.js
 *
 * Compresses and encodes storage-state.{env}.json into a base64 string
 * that fits within GitHub Actions 48 KB secret size limit.
 * Automatically copies the result to your system clipboard.
 *
 * Usage:
 *   node scripts/export-auth.js dev
 *   node scripts/export-auth.js prod
 *   npm run auth:dev:export
 *   npm run auth:prod:export
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawn } = require('child_process');

const env = (process.argv[2] || process.env.TEST_ENV || 'dev').toLowerCase().trim();
const isProd = env === 'prod';
const authFileName = `storage-state.${env}.json`;
const authFilePath = path.resolve(__dirname, '..', authFileName);
const secretName = isProd ? 'PROD_STORAGE_STATE' : 'DEV_STORAGE_STATE';

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log(`║     Export Auth Session: ${env.toUpperCase().padEnd(28)}║`);
console.log('╚══════════════════════════════════════════════════════╝\n');

if (!fs.existsSync(authFilePath)) {
  console.error(`❌ File not found: ${authFileName}`);
  console.error(`👉 Please run the auth setup first:\n   npm run auth:${env}\n`);
  process.exit(1);
}

// Read raw file
const rawContent = fs.readFileSync(authFilePath);
const originalSizeKB = (rawContent.length / 1024).toFixed(1);

// Compress with gzip and convert to Base64
const compressed = zlib.gzipSync(rawContent);
const base64String = compressed.toString('base64');
const compressedSizeKB = (base64String.length / 1024).toFixed(1);

console.log(`📦 Original size   : ${originalSizeKB} KB (${rawContent.length} bytes)`);
console.log(`🗜️  Compressed size : ${compressedSizeKB} KB (${base64String.length} bytes)`);
console.log(`📏 GitHub Limit    : 48.0 KB (48,000 bytes)`);

if (base64String.length >= 48000) {
  console.error(`\n❌ Error: Compressed size still exceeds GitHub 48 KB limit!`);
  process.exit(1);
}

console.log(`✅ Size check passed: Fits easily within GitHub Secret limits!\n`);

// Copy to clipboard depending on OS
function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    let proc;
    if (process.platform === 'win32') {
      proc = spawn('clip');
    } else if (process.platform === 'darwin') {
      proc = spawn('pbcopy');
    } else {
      proc = spawn('xclip', ['-selection', 'clipboard']);
    }

    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Clipboard process exited with code ${code}`));
    });

    proc.stdin.write(text);
    proc.stdin.end();
  });
}

copyToClipboard(base64String)
  .then(() => {
    console.log('📋 COPIED TO CLIPBOARD SUCCESSFULLY!');
    console.log('\nNext steps:');
    console.log(`1. Go to GitHub → Settings → Secrets and variables → Actions`);
    console.log(`2. Click "New repository secret" (or update existing)`);
    console.log(`3. Secret Name  : ${secretName}`);
    console.log(`4. Secret Value : Press Ctrl + V to paste`);
    console.log(`5. Click "Add secret" / "Update secret"\n`);
  })
  .catch((err) => {
    // If clipboard fails, save to a temporary file
    const b64Path = path.resolve(__dirname, '..', `storage-state.${env}.b64`);
    fs.writeFileSync(b64Path, base64String, 'utf8');
    console.warn(`⚠️ Could not auto-copy to clipboard: ${err.message}`);
    console.log(`📄 Saved compressed string to: storage-state.${env}.b64`);
    console.log(`   Open that file and copy its contents into secret: ${secretName}\n`);
  });
