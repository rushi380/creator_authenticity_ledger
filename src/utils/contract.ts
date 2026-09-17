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
 *
 * Verification is fully on-chain: see utils/onchain.ts for the real
 * prove → balance → sign → submit → finalize pipeline.
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
import { proveCreatorAuthenticityOnChain, type OnChainProveResult } from '@/utils/onchain';
import { getEnvironment } from '@/utils/environment';

export type { OnChainProveResult };

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

async function buildWalletState(
  connector: MidnightWalletConnector,
  network: string,
  walletId: string,
  walletName: string,
): Promise<WalletState> {
  const addressResult = await connector.getUnshieldedAddress().catch(() => ({ unshieldedAddress: '' }));
  const unshieldedBalances = await connector.getUnshieldedBalances().catch(() => ({}));
  const dustBalance = await connector.getDustBalance().catch(() => ({ cap: 0n, balance: 0n }));
  const config = await connector.getConfiguration().catch(() => ({ networkId: network }));

  const nativeBalance = ('native' in unshieldedBalances ? unshieldedBalances['native'] : 0n);
  const balanceDisplay = nativeBalance > 0n ? nativeBalance.toString() : dustBalance.balance.toString();

  return {
    status:  'connected',
    address: addressResult.unshieldedAddress || null,
    balance: balanceDisplay || null,
    network: config.networkId || network,
    error:   null,
    walletId,
    walletName,
  };
}

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
  const walletState = await buildWalletState(connector, network, 'mnLace', 'Lace Wallet');
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
  const walletState = await buildWalletState(connector, network, '1am', '1AM Wallet');
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

  const walletState = await buildWalletState(connector, network, walletId, wallet.name || walletId);
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

// ── Contract interaction (real on-chain pipeline) ─────────────────────────────

export interface CircuitCallResult {
  success: boolean;
  txHash: string | null;
  contractAddress: string | null;
  error: string | null;
  verificationState: VerificationState;
}

/**
 * Submits a real proveAuthenticity() call transaction to the deployed
 * Midnight contract through the connected wallet, and waits for on-chain
 * finalization. The returned transaction hash is the actual chain hash.
 */
export async function proveCreatorAuthenticity(
  connector: MidnightWalletConnector,
  metrics: CreatorPrivateMetrics,
  minEngagementBps: number,
  minConsistency: number,
  minAudienceScore: number,
  onStepChange: (step: string) => void,
  reconnect?: () => Promise<MidnightWalletConnector>
): Promise<CircuitCallResult> {
  const env = {
    ...getEnvironment(),
    thresholds: { minEngagementBps, minConsistency, minAudienceScore },
  };

  const result = await proveCreatorAuthenticityOnChain(
    connector,
    env,
    metrics,
    onStepChange,
    { reconnect },
  );

  return {
    success: result.success,
    txHash: result.txHash,
    contractAddress: result.contractAddress,
    error: result.error,
    verificationState: {
      step: result.success ? 'verified' : 'failed',
      txHash: result.txHash,
      contractAddress: result.contractAddress,
      error: result.error,
      timestamp: Date.now(),
    },
  };
}
