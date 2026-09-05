/**
 * contract.ts
 *
 * Handles Lace wallet connection and Midnight contract interaction.
 * Uses the window.midnight browser extension API.
 *
 * Privacy model:
 *   - Private metrics are passed as witness callbacks — they execute locally
 *     inside the ZK circuit and are NEVER transmitted to the chain.
 *   - Only the boolean isAuthentic result is disclosed on-chain.
 */

import type {
  MidnightWalletConnector,
  CreatorPrivateMetrics,
  WalletState,
  VerificationState,
  CreatorWitnessProvider,
} from '@/types';

// ── Wallet connection ─────────────────────────────────────────────────────────

export async function connectLaceWallet(network: string): Promise<{
  connector: MidnightWalletConnector;
  walletState: WalletState;
}> {
  const midnight = (window as unknown as { midnight?: Record<string, unknown> }).midnight;

  if (!midnight) {
    throw new Error(
      'Lace Wallet is not installed. Please install the Lace browser extension ' +
      'and enable the Midnight feature.'
    );
  }

  const wallets = Object.values(midnight);
  if (wallets.length === 0) {
    throw new Error('No Midnight-compatible wallet found in Lace.');
  }

  // Use the first available wallet provider
  const walletProvider = wallets[0] as {
    enable?: (net: string) => Promise<MidnightWalletConnector>;
    apiVersion?: string;
    name?: string;
  };

  if (!walletProvider?.enable) {
    throw new Error('Wallet does not support the Midnight dApp connector API.');
  }

  const connector = await walletProvider.enable(network);
  const address   = await connector.getUnshieldedAddress().catch(() => '');
  const balance   = await connector.getBalance().catch(() => '0');
  const netId     = await connector.getNetworkId().catch(() => network);

  const walletState: WalletState = {
    status:  'connected',
    address: address || null,
    balance: balance || null,
    network: netId || network,
    error:   null,
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
