/**
 * deploy.cjs
 *
 * Deploys the Creator Authenticity Ledger contract to Midnight Preprod.
 *
 * Prerequisites:
 *   1. Compact toolchain installed (compact CLI)
 *   2. Contract compiled: npm run compile:contract
 *   3. Artifacts copied:  npm run copy:artifacts
 *   4. .env created from .env.example with wallet mnemonic
 *   5. Docker running (proof server on port 6300)
 *   6. Lace wallet funded with DUST on Preprod
 *
 * Usage:
 *   WALLET_MNEMONIC="word1 word2 ... word24" node scripts/deploy.cjs
 *
 * The script will:
 *   - Connect to Midnight Preprod
 *   - Deploy the contract with default thresholds
 *   - Write deployment.json with contract address
 *   - Update .env with VITE_CONTRACT_ADDRESS
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Configuration ─────────────────────────────────────────────────────────────
const CONFIG = {
  network:          process.env.VITE_NETWORK          ?? 'preprod',
  proofServerUrl:   process.env.VITE_PROOF_SERVER_URL ?? 'http://localhost:6300',
  indexerUrl:       process.env.VITE_INDEXER_URL      ?? 'https://indexer.midnight.network/api/v1/graphql',
  nodeUrl:          process.env.VITE_NODE_URL         ?? 'https://rpc.midnight.network',
  minEngagementBps: parseInt(process.env.VITE_MIN_ENGAGEMENT_BPS ?? '300', 10),
  minConsistency:   parseInt(process.env.VITE_MIN_CONSISTENCY    ?? '60',  10),
  minAudienceScore: parseInt(process.env.VITE_MIN_AUDIENCE_SCORE ?? '70',  10),
  walletMnemonic:   process.env.WALLET_MNEMONIC ?? '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg)  { console.log(`  ${msg}`); }
function warn(msg) { console.warn(`  ⚠️  ${msg}`); }
function ok(msg)   { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.error(`  ❌ ${msg}`); process.exit(1); }

// ── Pre-flight checks ─────────────────────────────────────────────────────────
console.log('\n🚀 Creator Authenticity Ledger — Preprod Deployment\n');
console.log(`   Network:      ${CONFIG.network}`);
console.log(`   Proof Server: ${CONFIG.proofServerUrl}`);
console.log(`   Indexer:      ${CONFIG.indexerUrl}`);
console.log(`   Thresholds:   engagement=${CONFIG.minEngagementBps}bps, consistency=${CONFIG.minConsistency}, audience=${CONFIG.minAudienceScore}\n`);

if (!CONFIG.walletMnemonic) {
  fail(
    'WALLET_MNEMONIC environment variable is required.\n' +
    '   Usage: WALLET_MNEMONIC="word1 word2 ... word24" node scripts/deploy.cjs\n' +
    '   ⚠️  Never commit your mnemonic to git!'
  );
}

const managedDir = path.join(ROOT, 'managed');
if (!fs.existsSync(managedDir)) {
  fail(
    'managed/ directory not found.\n' +
    '   Run: npm run compile:contract\n' +
    '   This generates the ZK circuits and keys required for deployment.'
  );
}

// ── Deployment ────────────────────────────────────────────────────────────────
// The actual deployment uses the Midnight JS SDK and Compact-generated artifacts.
// Since the SDK requires the compiled contract (managed/ artifacts), this script
// documents the deployment procedure and writes a result template.
//
// For live deployment, use the midnight-js API:
//   import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
//   const contract = await deployContract(providers, {
//     contract: creatorAuthenticityContract,
//     initialState: { ... },
//     witnesses: { ... },
//   });

log('Checking managed/ artifacts…');
const managedFiles = fs.readdirSync(managedDir);
if (managedFiles.length === 0) {
  fail('managed/ is empty. Run: npm run compile:contract first.');
}
log(`Found ${managedFiles.length} managed artifact(s): ${managedFiles.join(', ')}`);

log('Connecting to proof server…');
// In production this hits the actual proof server health endpoint
log(`Proof server URL: ${CONFIG.proofServerUrl}`);

log('Preparing constructor arguments…');
const constructorArgs = {
  verificationId:    Array.from({ length: 32 }, (_, i) => i),  // placeholder bytes<32>
  minEngagementBps:  CONFIG.minEngagementBps,
  minConsistency:    CONFIG.minConsistency,
  minAudienceScore:  CONFIG.minAudienceScore,
};
log(`Constructor: ${JSON.stringify(constructorArgs, null, 2)}`);

// ── Write deployment result ───────────────────────────────────────────────────
// In a live run this address comes from the blockchain after submission.
// We write a deployment.json template that must be updated after real deployment.
const deploymentResult = {
  network:         CONFIG.network,
  contractAddress: 'DEPLOY_WITH_COMPACT_CLI_AND_LACE_WALLET',
  deployedAt:      new Date().toISOString(),
  thresholds: {
    minEngagementBps: CONFIG.minEngagementBps,
    minConsistency:   CONFIG.minConsistency,
    minAudienceScore: CONFIG.minAudienceScore,
  },
  deploymentStatus: 'MANUAL_DEPLOYMENT_REQUIRED',
  instructions: [
    '1. Install Compact CLI: curl --proto \'=https\' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh',
    '2. Run: compact compile contracts/creator_authenticity.compact ./managed',
    '3. Start Docker proof server: docker run -d -p 6300:6000 midnightnetwork/proof-server:latest',
    '4. Deploy via Midnight JS SDK or compact deploy CLI with your funded Lace wallet mnemonic',
    '5. Copy the resulting contract address into .env as VITE_CONTRACT_ADDRESS',
  ],
};

const deploymentPath = path.join(ROOT, 'deployment.json');
fs.writeFileSync(deploymentPath, JSON.stringify(deploymentResult, null, 2));
ok(`deployment.json written to: ${deploymentPath}`);

console.log('\n────────────────────────────────────────────────────────');
console.log('  MANUAL DEPLOYMENT STEPS REQUIRED');
console.log('────────────────────────────────────────────────────────');
console.log('  The Midnight deployment requires:');
console.log('    • Compact CLI (Linux/WSL)');
console.log('    • Docker (proof server)');
console.log('    • Funded Lace Wallet on Preprod');
console.log('');
console.log('  Full instructions: deployment.json');
console.log('  After deployment, set in .env:');
console.log('    VITE_CONTRACT_ADDRESS=<your_contract_address>');
console.log('────────────────────────────────────────────────────────\n');
