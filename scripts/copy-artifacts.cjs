/**
 * copy-artifacts.cjs
 *
 * Copies compiled Compact artifacts from managed/ into public/
 * so Vite bundles them for the frontend.
 *
 * Run after: compact compile contracts/creator_authenticity.compact ./managed
 *
 * Output structure expected by the Midnight SDK:
 *   public/keys/   — prover key + verifier key
 *   public/zkir/   — ZK intermediate representation
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const MANAGED = path.join(ROOT, 'managed');
const PUB_KEYS= path.join(ROOT, 'public', 'keys');
const PUB_ZKIR= path.join(ROOT, 'public', 'zkir');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFiles(srcDir, destDir, extensions) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`  [skip] Source directory not found: ${srcDir}`);
    return 0;
  }
  ensureDir(destDir);
  let count = 0;
  for (const file of fs.readdirSync(srcDir)) {
    if (extensions.some(ext => file.endsWith(ext))) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      console.log(`  copied: ${file} → ${path.relative(ROOT, destDir)}/`);
      count++;
    }
  }
  return count;
}

console.log('\n📦 Copying Compact artifacts…\n');

ensureDir(PUB_KEYS);
ensureDir(PUB_ZKIR);

// Keys: .pk (prover key), .vk (verifier key)
const keysDir  = path.join(MANAGED, 'keys');
const zkirDir  = path.join(MANAGED, 'zkir');
const buildDir = path.join(MANAGED);  // some versions output flat

let copied = 0;
copied += copyFiles(keysDir,  PUB_KEYS, ['.pk', '.vk', '.key']);
copied += copyFiles(zkirDir,  PUB_ZKIR, ['.zkir', '.json']);
copied += copyFiles(buildDir, PUB_KEYS, ['.pk', '.vk']);
copied += copyFiles(buildDir, PUB_ZKIR, ['.zkir']);

if (copied === 0) {
  console.warn('\n⚠️  No artifacts found. Run: npm run compile:contract first.\n');
  console.warn('   Expected directories:');
  console.warn(`     ${keysDir}`);
  console.warn(`     ${zkirDir}`);
} else {
  console.log(`\n✅ Copied ${copied} artifact(s) to public/\n`);
}
