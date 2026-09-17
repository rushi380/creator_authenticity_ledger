/**
 * deploy-dryrun.mjs
 *
 * Performs a DRY-RUN deployment validation of the Creator Authenticity Ledger contract.
 * Verifies all prerequisites WITHOUT submitting a transaction or requiring a wallet.
 *
 * Checks:
 *   1. Compiled contract artifacts exist (managed/)
 *   2. ZK keys are present
 *   3. Proof server is reachable
 *   4. Contract module loads correctly
 *   5. Constructor arguments are valid
 *   6. SDK packages can be imported
 *
 * Usage (WSL):
 *   node scripts/deploy-dryrun.mjs
 */

import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { existsSync, readdirSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Configuration ─────────────────────────────────────────────────────────────
const PROOF_SERVER = process.env.VITE_PROOF_SERVER_URL ?? 'http://localhost:6300';
const INDEXER_URL  = process.env.VITE_INDEXER_URL      ?? 'https://indexer.preview.midnight.network/api/v4/graphql';
const NODE_URL     = process.env.VITE_NODE_URL         ?? 'https://rpc.preview.midnight.network';

const MIN_ENGAGEMENT_BPS = BigInt(process.env.VITE_MIN_ENGAGEMENT_BPS ?? '300');
const MIN_CONSISTENCY    = BigInt(process.env.VITE_MIN_CONSISTENCY    ?? '60');
const MIN_AUDIENCE_SCORE = BigInt(process.env.VITE_MIN_AUDIENCE_SCORE ?? '70');

// ── Helpers ───────────────────────────────────────────────────────────────────
const PASS = '  ✅';
const FAIL = '  ❌';
const WARN = '  ⚠️ ';
const INFO = '  ℹ️ ';

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function pass(msg) { passCount++; console.log(`${PASS} ${msg}`); }
function fail(msg) { failCount++; console.log(`${FAIL} ${msg}`); }
function warn(msg) { warnCount++; console.log(`${WARN} ${msg}`); }
function info(msg) { console.log(`${INFO} ${msg}`); }

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  🌙 Creator Authenticity Ledger — DRY-RUN Deployment Check');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log(`  Network:      preview`);
console.log(`  Proof Server: ${PROOF_SERVER}`);
console.log(`  Indexer:      ${INDEXER_URL}`);
console.log(`  Thresholds:   engagement=${MIN_ENGAGEMENT_BPS}bps, consistency=${MIN_CONSISTENCY}, audience=${MIN_AUDIENCE_SCORE}`);
console.log('');

// ── Check 1: managed/ directory ──────────────────────────────────────────────
console.log('── Step 1/6: Compiled Contract Artifacts ──');
const managedDir = join(ROOT, 'managed');
if (existsSync(managedDir)) {
  const contents = readdirSync(managedDir);
  pass(`managed/ directory exists (${contents.length} entries: ${contents.join(', ')})`);
} else {
  fail('managed/ directory NOT found. Run: compact compile contracts/creator_authenticity.compact ./managed');
}

const contractIndex = join(managedDir, 'contract', 'index.js');
if (existsSync(contractIndex)) {
  pass(`managed/contract/index.js exists`);
} else {
  fail('managed/contract/index.js NOT found — contract not compiled');
}

// ── Check 2: ZK Keys ────────────────────────────────────────────────────────
console.log('');
console.log('── Step 2/6: ZK Keys ──');
const keysDir = join(managedDir, 'keys');
if (existsSync(keysDir)) {
  const keys = readdirSync(keysDir);
  pass(`managed/keys/ directory exists (${keys.length} files)`);

  const expectedKeys = [
    'proveAuthenticity.prover',
    'proveAuthenticity.verifier',
    'resetVerification.prover',
    'resetVerification.verifier',
  ];

  for (const k of expectedKeys) {
    if (keys.includes(k)) {
      pass(`Key file: ${k}`);
    } else {
      fail(`Missing key file: ${k}`);
    }
  }
} else {
  fail('managed/keys/ directory NOT found');
}

// ── Check 3: ZKIR ────────────────────────────────────────────────────────────
console.log('');
console.log('── Step 3/6: ZKIR Artifacts ──');
const zkirDir = join(managedDir, 'zkir');
if (existsSync(zkirDir)) {
  const zkirFiles = readdirSync(zkirDir);
  pass(`managed/zkir/ directory exists (${zkirFiles.length} files)`);
} else {
  warn('managed/zkir/ directory not found (may not be required for deployment)');
}

// ── Check 4: Proof Server ────────────────────────────────────────────────────
console.log('');
console.log('── Step 4/6: Proof Server Connectivity ──');
try {
  const response = await fetch(PROOF_SERVER, {
    method: 'GET',
    signal: AbortSignal.timeout(5000),
  });
  if (response.ok || response.status < 500) {
    pass(`Proof server reachable at ${PROOF_SERVER} (HTTP ${response.status})`);
  } else {
    warn(`Proof server responded with HTTP ${response.status} — might be OK (some return 404 on root)`);
  }
} catch (err) {
  if (err.name === 'TypeError' && err.message.includes('fetch')) {
    // Node 18 without fetch
    info('fetch() not available in this Node version — trying http request...');
    try {
      const http = await import('http');
      await new Promise((resolve, reject) => {
        const req = http.get(PROOF_SERVER, { timeout: 5000 }, (res) => {
          pass(`Proof server reachable at ${PROOF_SERVER} (HTTP ${res.statusCode})`);
          resolve();
        });
        req.on('error', (e) => {
          fail(`Proof server NOT reachable: ${e.message}`);
          resolve();
        });
        req.on('timeout', () => {
          fail('Proof server connection timed out');
          req.destroy();
          resolve();
        });
      });
    } catch {
      fail(`Cannot connect to proof server at ${PROOF_SERVER}`);
    }
  } else {
    fail(`Proof server NOT reachable at ${PROOF_SERVER}: ${err.message}`);
  }
}

// ── Check 5: Contract Module Loading ─────────────────────────────────────────
console.log('');
console.log('── Step 5/6: Contract Module Loading ──');
try {
  const contractMod = await import(pathToFileURL(contractIndex).href);
  if (contractMod.Contract) {
    pass('Contract class loaded from managed/contract/index.js');

    // Try to instantiate with no-op witnesses
    const witnesses = {
      followerCount:           (ctx) => [ctx?.privateState ?? {}, 0n],
      genuineEngagementCount:  (ctx) => [ctx?.privateState ?? {}, 0n],
      postingConsistencyScore: (ctx) => [ctx?.privateState ?? {}, 0n],
      verifiedAudienceScore:   (ctx) => [ctx?.privateState ?? {}, 0n],
    };
    const contract = new contractMod.Contract(witnesses);
    pass('Contract instantiated with no-op witnesses');
  } else {
    warn('Contract module loaded but Contract class not found — checking exports...');
    info(`Available exports: ${Object.keys(contractMod).join(', ')}`);
  }
} catch (err) {
  fail(`Failed to load contract module: ${err.message}`);
}

// ── Check 6: Constructor Arguments ───────────────────────────────────────────
console.log('');
console.log('── Step 6/6: Constructor Arguments ──');

const verificationId = new Uint8Array(32);
const label = 'creator-authenticity-ledger-v1';
for (let i = 0; i < Math.min(label.length, 32); i++) {
  verificationId[i] = label.charCodeAt(i);
}

pass(`verificationId: Bytes<32> = "${label}" (${verificationId.length} bytes)`);
pass(`minEngagementBps: ${MIN_ENGAGEMENT_BPS}`);
pass(`minConsistency:   ${MIN_CONSISTENCY}`);
pass(`minAudienceScore: ${MIN_AUDIENCE_SCORE}`);

// Validate ranges
if (MIN_ENGAGEMENT_BPS > 0n && MIN_ENGAGEMENT_BPS <= 10000n) {
  pass('Engagement threshold in valid range (0-10000 bps)');
} else {
  fail(`Engagement threshold out of range: ${MIN_ENGAGEMENT_BPS}`);
}

if (MIN_CONSISTENCY >= 0n && MIN_CONSISTENCY <= 100n) {
  pass('Consistency threshold in valid range (0-100)');
} else {
  fail(`Consistency threshold out of range: ${MIN_CONSISTENCY}`);
}

if (MIN_AUDIENCE_SCORE >= 0n && MIN_AUDIENCE_SCORE <= 100n) {
  pass('Audience score threshold in valid range (0-100)');
} else {
  fail(`Audience score threshold out of range: ${MIN_AUDIENCE_SCORE}`);
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  DRY-RUN SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  ✅ Passed:   ${passCount}`);
console.log(`  ❌ Failed:   ${failCount}`);
console.log(`  ⚠️  Warnings: ${warnCount}`);
console.log('');

if (failCount === 0) {
  console.log('  🎉 ALL CHECKS PASSED! Your setup is ready for real deployment.');
  console.log('');
  console.log('  To deploy for real, run in WSL:');
  console.log('    WALLET_SEED="your 24 mnemonic words" node scripts/deploy-preprod.mjs');
  console.log('');
} else {
  console.log('  ⛔ Some checks FAILED. Fix the issues above before deploying.');
  console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

process.exit(failCount > 0 ? 1 : 0);
