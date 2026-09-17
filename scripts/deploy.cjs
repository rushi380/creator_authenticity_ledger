/**
 * deploy.cjs
 *
 * Preflight checker for deploying the Creator Authenticity Ledger contract.
 * Validates all prerequisites and prints the deployment procedure.
 *
 * This script DOES NOT deploy and DOES NOT write deployment.json — the real
 * deployment is done by scripts/deploy-preprod.mjs, which writes a genuine
 * deployment.json with the on-chain contract address.
 *
 * Prerequisites:
 *   1. Compact toolchain installed (compact CLI)
 *   2. Contract compiled: npm run compile:contract
 *   3. Artifacts copied:  npm run copy:artifacts
 *   4. Docker running (proof server on port 6300)
 *   5. Wallet funded with DUST on the target network
 *
 * Usage:
 *   node scripts/deploy.cjs            # preflight checks only
 *   npm run deploy:preview             # REAL deployment (WALLET_SEED required)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Configuration ─────────────────────────────────────────────────────────────
const CONFIG = {
  network:          process.env.VITE_NETWORK          ?? 'preview',
  proofServerUrl:   process.env.VITE_PROOF_SERVER_URL ?? 'http://localhost:6300',
  indexerUrl:       process.env.VITE_INDEXER_URL      ?? 'https://indexer.preview.midnight.network/api/v4/graphql',
  nodeUrl:          process.env.VITE_NODE_URL         ?? 'https://rpc.preview.midnight.network',
  minEngagementBps: parseInt(process.env.VITE_MIN_ENGAGEMENT_BPS ?? '300', 10),
  minConsistency:   parseInt(process.env.VITE_MIN_CONSISTENCY    ?? '60',  10),
  minAudienceScore: parseInt(process.env.VITE_MIN_AUDIENCE_SCORE ?? '70',  10),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg)  { console.log(`  ${msg}`); }
function warn(msg) { console.warn(`  ⚠️  ${msg}`); }
function ok(msg)   { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.error(`  ❌ ${msg}`); process.exit(1); }

// ── Pre-flight checks ─────────────────────────────────────────────────────────
console.log('\n🔍 Creator Authenticity Ledger — Deployment Preflight\n');
console.log(`   Network:      ${CONFIG.network}`);
console.log(`   Proof Server: ${CONFIG.proofServerUrl}`);
console.log(`   Indexer:      ${CONFIG.indexerUrl}`);
console.log(`   Thresholds:   engagement=${CONFIG.minEngagementBps}bps, consistency=${CONFIG.minConsistency}, audience=${CONFIG.minAudienceScore}\n`);

const managedDir = path.join(ROOT, 'managed');
if (!fs.existsSync(managedDir)) {
  fail(
    'managed/ directory not found.\n' +
    '   Run: npm run compile:contract\n' +
    '   This generates the ZK circuits and keys required for deployment.'
  );
}

log('Checking managed/ artifacts…');
const requiredArtifacts = [
  'contract/index.js',
  'keys/proveAuthenticity.prover',
  'keys/proveAuthenticity.verifier',
  'zkir/proveAuthenticity.zkir',
];
for (const artifact of requiredArtifacts) {
  const p = path.join(managedDir, artifact);
  if (!fs.existsSync(p)) {
    fail(`Missing managed/${artifact}. Run: npm run build:contract`);
  }
}
ok(`All required artifacts present in managed/`);

// ── Deployment status ─────────────────────────────────────────────────────────
const deploymentPath = path.join(ROOT, 'deployment.json');
if (fs.existsSync(deploymentPath)) {
  try {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    if (deployment.contractAddress && deployment.txHash) {
      ok('Contract already deployed:');
      log(`   Network:          ${deployment.network}`);
      log(`   Contract Address: ${deployment.contractAddress}`);
      log(`   TX Hash:          ${deployment.txHash}`);
      log(`   Deployed At:      ${deployment.deployedAt}`);
      log('');
      log('   The frontend reads this address automatically (deployment.json fallback).');
    } else {
      warn('deployment.json exists but has no contract address — run a real deployment.');
    }
  } catch {
    warn('deployment.json is not valid JSON.');
  }
} else {
  warn('No deployment.json yet — the contract has not been deployed.');
}

// ── Real deployment procedure ─────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────────');
console.log('  TO DEPLOY (or re-deploy) THE CONTRACT');
console.log('────────────────────────────────────────────────────────');
console.log('  Requirements:');
console.log('    • WSL/Linux (wallet SDK + compact toolchain)');
console.log('    • Docker proof server: docker run -d -p 6300:6300 midnightntwrk/proof-server:8.0.3');
console.log('    • Funded wallet (DUST) — get funds from the Midnight Preview faucet');
console.log('');
console.log('  Then run:');
console.log('    WALLET_SEED="your 24-word mnemonic" npm run deploy:preview');
console.log('');
console.log('  The script writes deployment.json with the real contract');
console.log('  address and prints the values to put into .env.');
console.log('────────────────────────────────────────────────────────\n');
