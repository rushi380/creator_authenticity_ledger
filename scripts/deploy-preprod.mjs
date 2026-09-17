/**
 * deploy-preprod.mjs
 *
 * Deploys the Creator Authenticity Ledger contract to Midnight Preview.
 * Reads WALLET_SEED from environment variable (never hardcoded).
 *
 * Usage (in WSL/Linux):
 *   WALLET_SEED="your 24 mnemonic words here" node scripts/deploy-preprod.mjs
 *
 * Prerequisites:
 *   - npm install (all deps installed)
 *   - compact compile already run (managed/ artifacts present)
 *   - Docker proof server running on port 6300
 *   - Lace wallet funded with DUST on Preview
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { mnemonicToSeedSync } from 'bip39';
import { WebSocket } from 'ws';

globalThis.WebSocket = WebSocket;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const WALLET_CACHE_DIR = join(ROOT, '.wallet-cache');

// ── Config ────────────────────────────────────────────────────────────────────
const NETWORK      = process.env.VITE_NETWORK            ?? 'preview';
const PROOF_SERVER = process.env.VITE_PROOF_SERVER_URL   ?? 'http://localhost:6300';
const INDEXER_URL  = process.env.VITE_INDEXER_URL        ?? 'https://indexer.preview.midnight.network/api/v4/graphql';
const INDEXER_WS_URL = process.env.VITE_INDEXER_WS_URL   ?? 'wss://indexer.preview.midnight.network/api/v4/graphql/ws';
const NODE_URL     = process.env.VITE_NODE_URL           ?? 'https://rpc.preview.midnight.network';
const WALLET_SEED  = process.env.WALLET_SEED             ?? '';
const PRIVATE_STATE_PASSWORD = process.env.PRIVATE_STATE_PASSWORD ?? 'CreatorAuthLedger-Preview-2026!';
const SYNC_TIMEOUT_MS = Number(process.env.WALLET_SYNC_TIMEOUT_MS ?? 7_200_000); // 120 minutes

const MIN_ENGAGEMENT_BPS = BigInt(process.env.VITE_MIN_ENGAGEMENT_BPS ?? '300');
const MIN_CONSISTENCY    = BigInt(process.env.VITE_MIN_CONSISTENCY    ?? '60');
const MIN_AUDIENCE_SCORE = BigInt(process.env.VITE_MIN_AUDIENCE_SCORE ?? '70');

// ── Pre-flight ────────────────────────────────────────────────────────────────
console.log('\n🌙 Creator Authenticity Ledger — Preview Deployment\n');

if (!WALLET_SEED) {
  console.error('❌ WALLET_SEED environment variable is required.');
  console.error('   Usage: WALLET_SEED="word1 word2 ... word24" node scripts/deploy-preprod.mjs');
  process.exit(1);
}

const managedContract = join(ROOT, 'managed', 'contract', 'index.js');
if (!existsSync(managedContract)) {
  console.error('❌ managed/contract/index.js not found.');
  console.error('   Run: compact compile contracts/creator_authenticity.compact ./managed');
  process.exit(1);
}

console.log(`   Network:      ${NETWORK}`);
console.log(`   Proof Server: ${PROOF_SERVER}`);
console.log(`   Indexer:      ${INDEXER_URL}`);
console.log(`   Thresholds:   engagement=${MIN_ENGAGEMENT_BPS}bps, consistency=${MIN_CONSISTENCY}, audience=${MIN_AUDIENCE_SCORE}`);
console.log('');

// ── Load compiled contract ────────────────────────────────────────────────────
import { pathToFileURL } from 'url';
console.log('📦 Loading compiled contract...');
const { Contract } = await import(pathToFileURL(managedContract).href);
console.log('   ✅ Contract loaded');

// ── Load SDK packages ─────────────────────────────────────────────────────────
console.log('🔧 Loading Midnight JS SDK...');

let deployContract, levelPrivateStateProvider, indexerPublicDataProvider,
   httpClientProofProvider, NodeZkConfigProvider, setNetworkId, CompiledContract;

try {
  ({ deployContract }           = await import('@midnight-ntwrk/midnight-js-contracts'));
  ({ levelPrivateStateProvider } = await import('@midnight-ntwrk/midnight-js-level-private-state-provider'));
  ({ indexerPublicDataProvider } = await import('@midnight-ntwrk/midnight-js-indexer-public-data-provider'));
  ({ httpClientProofProvider }   = await import('@midnight-ntwrk/midnight-js-http-client-proof-provider'));
  ({ NodeZkConfigProvider }      = await import('@midnight-ntwrk/midnight-js-node-zk-config-provider'));
  ({ setNetworkId }              = await import('@midnight-ntwrk/midnight-js-network-id'));
  ({ CompiledContract }          = await import('@midnight-ntwrk/midnight-js-protocol/compact-js'));
  console.log('   ✅ SDK packages loaded');
} catch (err) {
  console.error('❌ Failed to load SDK packages:', err.message);
  console.error('   Run: npm install (in the project root)');
  process.exit(1);
}

// ── Set network ───────────────────────────────────────────────────────────────
setNetworkId(NETWORK);

// ── Build verificationId (Bytes<32>) ──────────────────────────────────────────
const verificationId = new Uint8Array(32);
const label = 'creator-authenticity-ledger-v1';
for (let i = 0; i < Math.min(label.length, 32); i++) {
  verificationId[i] = label.charCodeAt(i);
}

// ── Build witness provider ────────────────────────────────────────────────────
// For deployment, witnesses are not called (only constructor is run).
// We provide no-op witnesses for the deployment phase.
const witnesses = {
  followerCount:           (ctx) => [ctx.privateState, 0n],
  genuineEngagementCount:  (ctx) => [ctx.privateState, 0n],
  postingConsistencyScore: (ctx) => [ctx.privateState, 0n],
  verifiedAudienceScore:   (ctx) => [ctx.privateState, 0n],
};

// ── ZK config provider (reads from managed/ directory) ───────────────────────
const zkArtifactsDir = join(ROOT, 'managed');
const zkConfigProvider = new NodeZkConfigProvider(zkArtifactsDir);

const compiledContract = CompiledContract.withCompiledFileAssets(
  CompiledContract.withWitnesses(
    CompiledContract.make('creator-authenticity-ledger', Contract),
    witnesses,
  ),
  zkArtifactsDir,
);

// ── Private state provider ────────────────────────────────────────────────────
const privateStatePath = join(ROOT, '.private-state');
const privateStateProvider = levelPrivateStateProvider({
  privateStoragePasswordProvider: () => PRIVATE_STATE_PASSWORD,
  accountId: 'deploy-account',
  storePath: privateStatePath,
});

// ── Public data provider ──────────────────────────────────────────────────────
const wsIndexerUrl = INDEXER_WS_URL;
const publicDataProvider = indexerPublicDataProvider(INDEXER_URL, wsIndexerUrl);

// ── Proof provider ────────────────────────────────────────────────────────────
const proofProvider = httpClientProofProvider(PROOF_SERVER, zkConfigProvider);

// ── Wallet providers (from mnemonic) ──────────────────────────────────────────
console.log('👛 Building wallet from seed...');
let walletProvider, midnightProvider;

try {
  const walletMod = await import('@midnight-ntwrk/wallet-sdk');
  const ledger = await import('@midnight-ntwrk/midnight-js-protocol/ledger');
  const { DustWallet } = await import('@midnight-ntwrk/wallet-sdk-dust-wallet');
  const { ShieldedWallet } = await import('@midnight-ntwrk/wallet-sdk-shielded');
  const { createKeystore, PublicKey, UnshieldedWallet } =
    await import('@midnight-ntwrk/wallet-sdk-unshielded-wallet');
  const { InMemoryTransactionHistoryStorage } =
    await import('@midnight-ntwrk/wallet-sdk-abstractions');
  const { HDWallet, Roles, WalletFacade } = walletMod;

  const hdWallet = HDWallet.fromSeed(mnemonicToSeedSync(WALLET_SEED));
  if (hdWallet.type !== 'seedOk') throw new Error('Invalid wallet mnemonic');
  const derived = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (derived.type !== 'keysDerived') throw new Error('Unable to derive wallet keys');
  hdWallet.hdWallet.clear();

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derived.keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(derived.keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(derived.keys[Roles.NightExternal], NETWORK);
  const walletAddress = unshieldedKeystore.getBech32Address().asString();
  const SHIELDED_CACHE_FILE = join(WALLET_CACHE_DIR, 'shielded.state');
  const UNSHIELDED_CACHE_FILE = join(WALLET_CACHE_DIR, 'unshielded.state');
  const DUST_CACHE_FILE = join(WALLET_CACHE_DIR, 'dust.state');
  const WALLET_META_FILE = join(WALLET_CACHE_DIR, 'wallet.json');

  const cacheMatches = (() => {
    try {
      if (!existsSync(WALLET_META_FILE)) return false;
      const meta = JSON.parse(readFileSync(WALLET_META_FILE, 'utf8'));
      return meta.address === walletAddress && meta.network === NETWORK;
    } catch {
      return false;
    }
  })();

  const hasShieldedCache = cacheMatches && existsSync(SHIELDED_CACHE_FILE);
  const hasUnshieldedCache = cacheMatches && existsSync(UNSHIELDED_CACHE_FILE);
  const hasDustCache = cacheMatches && existsSync(DUST_CACHE_FILE);

  if (hasShieldedCache || hasUnshieldedCache || hasDustCache) {
    console.log(`   📂 Found existing wallet checkpoint cache for ${walletAddress.slice(0, 16)}...`);
    if (hasShieldedCache) console.log('      • Restoring shielded wallet checkpoint');
    if (hasUnshieldedCache) console.log('      • Restoring unshielded wallet checkpoint');
    if (hasDustCache) console.log('      • Restoring dust wallet checkpoint');
  }

  const configuration = {
    networkId: NETWORK,
    costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
    relayURL: new URL(NODE_URL.replace(/^http/, 'ws')),
    provingServerUrl: new URL(PROOF_SERVER),
    indexerClientConnection: { indexerHttpUrl: INDEXER_URL, indexerWsUrl: wsIndexerUrl },
    batchUpdates: {
      size: 1000,
      timeout: 5,
      spacing: 0,
    },
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  };

  console.log('   Initializing wallet services...');
  const wallet = await WalletFacade.init({
    configuration,
    shielded: (config) => {
      if (hasShieldedCache) {
        try {
          return ShieldedWallet(config).restore(readFileSync(SHIELDED_CACHE_FILE, 'utf8'));
        } catch (e) {
          console.warn('   ⚠️  Failed to restore shielded cache, starting fresh:', e.message);
        }
      }
      return ShieldedWallet(config).startWithSecretKeys(shieldedSecretKeys);
    },
    unshielded: (config) => {
      if (hasUnshieldedCache) {
        try {
          return UnshieldedWallet(config).restore(readFileSync(UNSHIELDED_CACHE_FILE, 'utf8'));
        } catch (e) {
          console.warn('   ⚠️  Failed to restore unshielded cache, starting fresh:', e.message);
        }
      }
      return UnshieldedWallet(config).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));
    },
    dust: (config) => {
      if (hasDustCache) {
        try {
          return DustWallet(config).restore(readFileSync(DUST_CACHE_FILE, 'utf8'));
        } catch (e) {
          console.warn('   ⚠️  Failed to restore dust cache, starting fresh:', e.message);
        }
      }
      return DustWallet(config).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust,
      );
    },
  });

  let latestState = null;
  const saveCheckpoint = (state) => {
    try {
      if (!existsSync(WALLET_CACHE_DIR)) {
        mkdirSync(WALLET_CACHE_DIR, { recursive: true });
      }
      if (state.shielded) {
        const serialized = state.shielded.serialize();
        writeFileSync(`${SHIELDED_CACHE_FILE}.tmp`, serialized, 'utf8');
        renameSync(`${SHIELDED_CACHE_FILE}.tmp`, SHIELDED_CACHE_FILE);
      }
      if (state.unshielded) {
        const serialized = state.unshielded.serialize();
        writeFileSync(`${UNSHIELDED_CACHE_FILE}.tmp`, serialized, 'utf8');
        renameSync(`${UNSHIELDED_CACHE_FILE}.tmp`, UNSHIELDED_CACHE_FILE);
      }
      if (state.dust) {
        const serialized = state.dust.serialize();
        writeFileSync(`${DUST_CACHE_FILE}.tmp`, serialized, 'utf8');
        renameSync(`${DUST_CACHE_FILE}.tmp`, DUST_CACHE_FILE);
      }
      writeFileSync(
        WALLET_META_FILE,
        JSON.stringify(
          { address: walletAddress, network: NETWORK, updatedAt: new Date().toISOString() },
          null,
          2,
        ),
        'utf8',
      );
    } catch {
      // Ignore transient checkpoint write errors
    }
  };

  const handleInterrupt = () => {
    console.log('\n   💾 Interrupted — saving wallet checkpoint before exit...');
    if (latestState) saveCheckpoint(latestState);
    process.exit(130);
  };
  process.on('SIGINT', handleInterrupt);
  process.on('SIGTERM', handleInterrupt);

  console.log('   Starting wallet synchronization...');
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  console.log('   Waiting for wallet sync (initial Preview sync can take several minutes)...');
  let lastSyncProgress = 'no progress received';
  let lastSavedApplied = 0n;
  let lastSaveTime = Date.now();

  const syncState = wallet.state().subscribe({
    next: (state) => {
      latestState = state;
      const progress = [
        ['unshielded', state.unshielded?.progress],
        ['shielded', state.shielded?.progress],
        ['dust', state.dust?.progress],
      ]
        .filter(([, value]) => value)
        .map(([name, value]) => {
          const applied = value.appliedIndex ?? value.appliedId ?? 0n;
          const relevant = value.highestRelevantWalletIndex ?? value.highestTransactionId ?? applied;
          const lag = relevant >= applied ? relevant - applied : applied - relevant;
          return `${name}=${applied} lag=${lag} connected=${value.isConnected}`;
        })
        .join(', ');
      lastSyncProgress = progress || lastSyncProgress;
      if (progress) console.log(`   Sync progress: ${progress}`);

      // Periodically persist checkpoint (every 5000 dust blocks or every 15s if progress made)
      const currentDustApplied = state.dust?.progress?.appliedIndex ?? 0n;
      const now = Date.now();
      if (
        currentDustApplied > lastSavedApplied &&
        (currentDustApplied - lastSavedApplied >= 5000n || now - lastSaveTime >= 15000)
      ) {
        saveCheckpoint(state);
        lastSavedApplied = currentDustApplied;
        lastSaveTime = now;
      }
    },
    error: (error) => {
      console.error('   Wallet state error:', error);
      if (String(error?.message ?? error).includes('non-linearly into dust generation tree')) {
        console.error('   ❌ Preview indexer returned DUST events out of order. Stop and retry from a clean wallet checkpoint.');
        process.exitCode = 1;
      }
    },
  });

  try {
    await Promise.race([
      wallet.waitForSyncedState(),
      new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                `Wallet synchronization timed out after ${Math.round(SYNC_TIMEOUT_MS / 60_000)} minutes. Last state: ${lastSyncProgress}`,
              ),
            ),
          SYNC_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (err) {
    if (latestState) saveCheckpoint(latestState);
    throw err;
  } finally {
    process.removeListener('SIGINT', handleInterrupt);
    process.removeListener('SIGTERM', handleInterrupt);
  }

  if (latestState) saveCheckpoint(latestState);
  syncState.unsubscribe();
  console.log(`   ✅ Wallet ready`);
  console.log(`   Address: ${walletAddress}`);

  walletProvider = midnightProvider = {
    getCoinPublicKey: () => shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => shieldedSecretKeys.encryptionPublicKey,
    balanceTx: async (tx, ttl) => {
      const effectiveTtl = ttl ?? new Date(Date.now() + 30 * 60 * 1000);
      const recipe = await wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys, dustSecretKey },
        { ttl: effectiveTtl },
      );
      return wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx) => wallet.submitTransaction(tx),
  };

} catch (err) {
  console.error('❌ Wallet setup failed:', err.message);
  console.error('   Make sure:');
  console.error('   1. WALLET_SEED is a valid 24-word mnemonic');
  console.error('   2. The wallet has DUST on Preview');
  console.error('   3. Docker proof server is running on port 6300');
  process.exit(1);
}

// ── Providers bundle ──────────────────────────────────────────────────────────
const providers = {
  privateStateProvider,
  publicDataProvider,
  zkConfigProvider,
  proofProvider,
  walletProvider,
  midnightProvider,
};

// ── Deploy ────────────────────────────────────────────────────────────────────
console.log('\n🚀 Deploying contract to Midnight Preview...');
console.log('   (This may take 1-2 minutes while the ZK proof is generated)');
console.log('');

let deployed;
try {
  deployed = await deployContract(providers, {
    compiledContract,
    initialPrivateState: {},
    privateStateId: 'creator-authenticity-ledger',
    args: [verificationId, MIN_ENGAGEMENT_BPS, MIN_CONSISTENCY, MIN_AUDIENCE_SCORE],
  });
} catch (err) {
  console.error('\n❌ Deployment failed:', err.message);
  if (err.message.includes('DUST')) {
    console.error('   → Fund your wallet with DUST on Midnight Preview faucet');
  }
  if (err.message.includes('proof')) {
    console.error('   → Ensure Docker proof server is running: docker ps');
  }
  process.exit(1);
}

const contractAddress = deployed.deployTxData.public.contractAddress;
console.log('\n✅ CONTRACT DEPLOYED SUCCESSFULLY!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`   Network:          Midnight Preview`);
console.log(`   Contract Address: ${contractAddress}`);
console.log(`   TX Hash:          ${deployed.deployTxData.public.txHash ?? 'N/A'}`);
console.log(`   Deployed At:      ${new Date().toISOString()}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── Write deployment.json ─────────────────────────────────────────────────────
const deploymentData = {
  network:         'preview',
  contractAddress,
  txHash:          deployed.deployTxData.public.txHash ?? null,
  deployedAt:      new Date().toISOString(),
  thresholds: {
    minEngagementBps: Number(MIN_ENGAGEMENT_BPS),
    minConsistency:   Number(MIN_CONSISTENCY),
    minAudienceScore: Number(MIN_AUDIENCE_SCORE),
  },
};

writeFileSync(join(ROOT, 'deployment.json'), JSON.stringify(deploymentData, null, 2));
console.log('   deployment.json updated ✅');

// ── Print next steps ──────────────────────────────────────────────────────────
console.log('\n📋 NEXT STEPS:');
console.log(`   1. Add to .env:`);
console.log(`      VITE_CONTRACT_ADDRESS=${contractAddress}`);
console.log(`   2. Rebuild frontend: npm run build`);
console.log(`   3. Deploy to Vercel: vercel --prod`);
console.log(`   4. Update README.md with the contract address above`);
console.log('');

process.exit(0);
