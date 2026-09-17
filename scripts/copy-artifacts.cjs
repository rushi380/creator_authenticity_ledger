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
const PUB_CIRCUITS = path.join(ROOT, 'public', 'circuits');

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
ensureDir(PUB_CIRCUITS);

// Keys: .prover (prover key), .verifier (verifier key), .pk, .vk, .key
const keysDir  = path.join(MANAGED, 'keys');
const zkirDir  = path.join(MANAGED, 'zkir');
const buildDir = path.join(MANAGED);  // some versions output flat

let copied = 0;
copied += copyFiles(keysDir,  PUB_KEYS, ['.prover', '.verifier', '.pk', '.vk', '.key']);
copied += copyFiles(zkirDir,  PUB_ZKIR, ['.zkir', '.bzkir', '.json']);
copied += copyFiles(zkirDir,  PUB_CIRCUITS, ['.zkir', '.bzkir', '.json']);
copied += copyFiles(buildDir, PUB_KEYS, ['.prover', '.verifier', '.pk', '.vk']);
copied += copyFiles(buildDir, PUB_ZKIR, ['.zkir', '.bzkir']);
copied += copyFiles(buildDir, PUB_CIRCUITS, ['.zkir', '.bzkir']);

if (copied === 0) {
  console.warn('\n⚠️  No artifacts found. Run: npm run compile:contract first.\n');
  console.warn('   Expected directories:');
  console.warn(`     ${keysDir}`);
  console.warn(`     ${zkirDir}`);
} else {
  console.log(`\n✅ Copied ${copied} artifact(s) to public/\n`);
}
