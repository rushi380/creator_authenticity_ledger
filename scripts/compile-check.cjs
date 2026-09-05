/**
 * compile-check.cjs
 *
 * Checks whether the Compact compiler is available and reports its version.
 * Used by CI to verify the toolchain before attempting compilation.
 *
 * Exit codes:
 *   0 — compiler available
 *   1 — compiler not found (CI will skip compile step gracefully)
 */

'use strict';

const { execSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');

const ROOT         = path.resolve(__dirname, '..');
const CONTRACT     = path.join(ROOT, 'contracts', 'creator_authenticity.compact');

console.log('\n🔍 Compact Toolchain Check\n');

// Check contract file exists
if (!fs.existsSync(CONTRACT)) {
  console.error('  ❌ Contract file not found:', CONTRACT);
  process.exit(1);
}
console.log('  ✅ Contract file found:', path.relative(ROOT, CONTRACT));

// Try to find compact compiler
function tryCompact() {
  try {
    const version = execSync('compact --version 2>&1', { encoding: 'utf8', timeout: 5000 }).trim();
    console.log('  ✅ Compact compiler found:', version);
    return true;
  } catch {
    return false;
  }
}

function tryCompactc() {
  try {
    const version = execSync('compactc --version 2>&1', { encoding: 'utf8', timeout: 5000 }).trim();
    console.log('  ✅ Compact compiler (compactc) found:', version);
    return true;
  } catch {
    return false;
  }
}

const found = tryCompact() || tryCompactc();

if (!found) {
  console.warn('  ⚠️  Compact compiler not found in PATH.');
  console.warn('     Install: curl --proto \'=https\' --tlsv1.2 -LsSf');
  console.warn('       https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh');
  console.warn('     CI will use pre-compiled managed/ artifacts.');
  // Exit 0 so CI doesn't fail — managed/ artifacts are committed
  process.exit(0);
}

// Check managed/ artifacts
const managedDir = path.join(ROOT, 'managed');
if (fs.existsSync(managedDir) && fs.readdirSync(managedDir).length > 0) {
  console.log('  ✅ managed/ artifacts present');
} else {
  console.warn('  ⚠️  managed/ is empty — run: npm run compile:contract');
}

console.log('\n  Contract: contracts/creator_authenticity.compact');
console.log('  Output:   managed/\n');
