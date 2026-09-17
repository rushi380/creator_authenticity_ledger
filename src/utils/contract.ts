/**
 * contract.ts
 *
 * Handles Lace and 1AM wallet connection and Midnight contract interaction.
 * Uses the window.midnight browser extension API (DApp Connector API v4).
 *
 * Privacy model:
 *   - Private metrics are passed as witness callbacks — they execute locally
 *     inside the ZK circuit and are NEVER transmitted to the chain.
 *   - Only the boolean isAuthentic result is disclosed on-chain.
 */

import type {
  MidnightWalletAPI,
  MidnightWalletConnector,
  CreatorPrivateMetrics,
  WalletState,
  VerificationState,
  CreatorWitnessProvider,
  WalletInfo,
} from '@/types';

// ── Wallet discovery ──────────────────────────────────────────────────────────

/**
 * The browser can expose more than one 1AM API.  Only the DApp Connector API
 * uses `connect(networkId)`.  Its other connection surface accepts an options
 * object containing `identifiers`, which is why calling every injected
 * `connect` function with a network string fails after the approval prompt.
 */
export function isDappConnectorV4(api: unknown): api is MidnightWalletAPI {
  if (!api || typeof api !== 'object') return false;

  const candidate = api as Partial<MidnightWalletAPI>;
  return typeof candidate.connect === 'function'
    && typeof candidate.name === 'string'
    && typeof candidate.rdns === 'string'
    && typeof candidate.apiVersion === 'string'
    && /^4(?:\.|$)/.test(candidate.apiVersion);
}

export function getAvailableWallets(): WalletInfo[] {
  const midnight = (window as unknown as { midnight?: Record<string, MidnightWalletAPI> }).midnight;
  if (!midnight) return [];

  return Object.entries(midnight)
    .filter(([, api]) => isDappConnectorV4(api))
    .map(([id, api]) => ({
      id,
      name: api.name || id,
      icon: api.icon || '',
      apiVersion: api.apiVersion || 'unknown',
    }));
}

function isOneAmWallet(wallet: MidnightWalletAPI): boolean {
  return /\b1am\b/i.test(wallet.name) || wallet.rdns?.toLowerCase().includes('1am') === true;
}

// ── Wallet connection ─────────────────────────────────────────────────────────

export async function connectLaceWallet(network: string): Promise<{
  connector: MidnightWalletConnector;
  walletState: WalletState;
}> {
  const midnight = (window as unknown as { midnight?: Record<string, MidnightWalletAPI> }).midnight;

  if (!midnight) {
    throw new Error(
      'No Midnight wallet is installed. Please install Lace or 1AM and enable the Midnight feature.'
    );
  }

  const laceWallet = midnight.mnLace || midnight.lace;
  if (!laceWallet?.connect) {
    throw new Error('Lace Wallet is not installed. Please install the Lace browser extension.');
  }

  const connector = await laceWallet.connect(network);
  const addressResult = await connector.getUnshieldedAddress().catch(() => ({ unshieldedAddress: '' }));
  const unshieldedBalances = await connector.getUnshieldedBalances().catch(() => ({}));
  const dustBalance = await connector.getDustBalance().catch(() => ({ cap: 0n, balance: 0n }));
  const config = await connector.getConfiguration().catch(() => ({ networkId: network }));

  const nativeBalance = ('native' in unshieldedBalances ? unshieldedBalances['native'] : 0n);
  const balanceDisplay = nativeBalance > 0n ? nativeBalance.toString() : dustBalance.balance.toString();

  const walletState: WalletState = {
    status:  'connected',
    address: addressResult.unshieldedAddress || null,
    balance: balanceDisplay || null,
    network: config.networkId || network,
    error:   null,
    walletId: 'mnLace',
    walletName: 'Lace Wallet',
  };

  return { connector, walletState };
}

export async function connect1amWallet(network: string): Promise<{
  connector: MidnightWalletConnector;
  walletState: WalletState;
}> {
  const midnight = (window as unknown as { midnight?: Record<string, MidnightWalletAPI> }).midnight;

  if (!midnight) {
    throw new Error(
      'No Midnight wallet is installed. Please install 1AM or Lace and enable the Midnight feature.'
    );
  }

  const oneAmWallet = midnight['1am'];
  if (!oneAmWallet?.connect) {
    throw new Error('1AM Wallet is not installed. Please install the 1AM browser extension.');
  }

  const connector = await oneAmWallet.connect(network);
  const addressResult = await connector.getUnshieldedAddress().catch(() => ({ unshieldedAddress: '' }));
  const unshieldedBalances = await connector.getUnshieldedBalances().catch(() => ({}));
  const dustBalance = await connector.getDustBalance().catch(() => ({ cap: 0n, balance: 0n }));
  const config = await connector.getConfiguration().catch(() => ({ networkId: network }));

  const nativeBalance = ('native' in unshieldedBalances ? unshieldedBalances['native'] : 0n);
  const balanceDisplay = nativeBalance > 0n ? nativeBalance.toString() : dustBalance.balance.toString();

  const walletState: WalletState = {
    status:  'connected',
    address: addressResult.unshieldedAddress || null,
    balance: balanceDisplay || null,
    network: config.networkId || network,
    error:   null,
    walletId: '1am',
    walletName: '1AM Wallet',
  };

  return { connector, walletState };
}

export async function connectWalletByid(
  walletId: string,
  network: string
): Promise<{
  connector: MidnightWalletConnector;
  walletState: WalletState;
}> {
  const midnight = (window as unknown as { midnight?: Record<string, MidnightWalletAPI> }).midnight;

  if (!midnight) {
    throw new Error(
      'No Midnight wallet is installed. Please install Lace or 1AM and enable the Midnight feature.'
    );
  }

  const wallet = midnight[walletId];
  if (!isDappConnectorV4(wallet)) {
    throw new Error(
      `Wallet "${walletId}" does not expose a compatible Midnight DApp Connector v4 API.`
    );
  }

  const connector = await wallet.connect(network);

  // 1AM 6.3.11 currently throws inside its own permission UI while processing
  // the standard parameterless getUnshieldedAddress() request. A connection
  // itself does not require an address or balance, so do not make that
  // optional read part of the connection handshake.
  if (isOneAmWallet(wallet)) {
    const config = await connector.getConfiguration().catch(() => ({ networkId: network }));
    return {
      connector,
      walletState: {
        status: 'connected',
        address: null,
        balance: null,
        network: config.networkId || network,
        error: null,
        walletId,
        walletName: wallet.name || walletId,
      },
    };
  }

  const addressResult = await connector.getUnshieldedAddress().catch(() => ({ unshieldedAddress: '' }));
  const unshieldedBalances = await connector.getUnshieldedBalances().catch(() => ({}));
  const dustBalance = await connector.getDustBalance().catch(() => ({ cap: 0n, balance: 0n }));
  const config = await connector.getConfiguration().catch(() => ({ networkId: network }));

  const nativeBalance = ('native' in unshieldedBalances ? unshieldedBalances['native'] : 0n);
  const balanceDisplay = nativeBalance > 0n ? nativeBalance.toString() : dustBalance.balance.toString();

  const walletState: WalletState = {
    status:  'connected',
    address: addressResult.unshieldedAddress || null,
    balance: balanceDisplay || null,
    network: config.networkId || network,
    error:   null,
    walletId,
    walletName: wallet.name || walletId,
  };

  return { connector, walletState };
}

// ── Witness provider ──────────────────────────────────────────────────────────

/**
 * Creates a witness provider that feeds private creator metrics into the
 * ZK circuit. These callbacks execute inside the local proof server and
 * the raw values never appear on-chain.
 */
export function createWitnessProvider(
  metrics: CreatorPrivateMetrics
): CreatorWitnessProvider {
  return {
    followerCount:          () => Promise.resolve(BigInt(metrics.followerCount)),
    genuineEngagementCount: () => Promise.resolve(BigInt(metrics.genuineEngagementCount)),
    postingConsistencyScore:() => Promise.resolve(BigInt(metrics.postingConsistencyScore)),
    verifiedAudienceScore:  () => Promise.resolve(BigInt(metrics.verifiedAudienceScore)),
  };
}

// ── Contract interaction (frontend simulation layer) ─────────────────────────
//
// When the real Compact compiler generates managed/ artifacts, the frontend
// uses @midnight-ntwrk/midnight-js-contracts to build and submit proofs.
// Until deployment artifacts are available, this layer simulates the circuit
// execution using the same mathematical rules as the Compact contract.
//
// The simulation validates the SAME arithmetic the Compact circuit enforces,
// so the privacy behavior is functionally identical — private values stay
// local, only the boolean result is surfaced.

export interface CircuitCallResult {
  success: boolean;
  txHash: string | null;
  contractAddress: string | null;
  error: string | null;
  verificationState: VerificationState;
}

function simulateAuthenticityCircuit(
  metrics: CreatorPrivateMetrics,
  minEngagementBps: number,
  minConsistency: number,
  minAudienceScore: number
): { passed: boolean; failReason: string | null } {
  const { followerCount, genuineEngagementCount, postingConsistencyScore, verifiedAudienceScore } = metrics;

  // Mirror exact Compact assertions
  if (followerCount <= 0) {
    return { passed: false, failReason: 'Follower count must be greater than zero' };
  }
  if (postingConsistencyScore > 100 || verifiedAudienceScore > 100) {
    return { passed: false, failReason: 'Score values must be between 0 and 100' };
  }

  // Integer basis-point arithmetic (mirrors Compact: genuine * 10000 >= followers * minBps)
  const lhs = BigInt(genuineEngagementCount) * 10000n;
  const rhs = BigInt(followerCount) * BigInt(minEngagementBps);
  if (lhs < rhs) {
    return { passed: false, failReason: 'Engagement rate is below the required threshold' };
  }

  if (postingConsistencyScore < minConsistency) {
    return { passed: false, failReason: 'Posting consistency is below the required threshold' };
  }

  if (verifiedAudienceScore < minAudienceScore) {
    return { passed: false, failReason: 'Verified audience score is below the required threshold' };
  }

  return { passed: true, failReason: null };
}

export async function proveCreatorAuthenticity(
  metrics: CreatorPrivateMetrics,
  minEngagementBps: number,
  minConsistency: number,
  minAudienceScore: number,
  onStepChange: (step: string) => void
): Promise<CircuitCallResult> {
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  try {
    onStepChange('preparing');
    await delay(800);

    onStepChange('generating_proof');
    await delay(1200);

    // Execute the circuit logic (same arithmetic as Compact contract)
    const { passed, failReason } = simulateAuthenticityCircuit(
      metrics, minEngagementBps, minConsistency, minAudienceScore
    );

    if (!passed) {
      return {
        success: false,
        txHash: null,
        contractAddress: null,
        error: failReason,
        verificationState: {
          step: 'failed',
          txHash: null,
          contractAddress: null,
          error: failReason,
          timestamp: Date.now(),
        },
      };
    }

    onStepChange('executing_circuit');
    await delay(1500);

    onStepChange('submitting');
    await delay(1000);

    // Generate a realistic-looking mock transaction hash
    const mockTxHash = `mn_tx_${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS ||
      'DEPLOY_CONTRACT_TO_GET_ADDRESS';

    onStepChange('confirmed');
    await delay(600);

    onStepChange('verified');

    return {
      success: true,
      txHash: mockTxHash,
      contractAddress,
      error: null,
      verificationState: {
        step: 'verified',
        txHash: mockTxHash,
        contractAddress,
        error: null,
        timestamp: Date.now(),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown circuit error';
    return {
      success: false,
      txHash: null,
      contractAddress: null,
      error: msg,
      verificationState: {
        step: 'failed',
        txHash: null,
        contractAddress: null,
        error: msg,
        timestamp: Date.now(),
      },
    };
  }
}
