/**
 * onchain.ts
 *
 * Real Midnight on-chain integration. No simulation.
 *
 * Every verification submitted through this module:
 *   1. Locally executes the compiled Compact circuit with the creator's
 *      private metrics as witness inputs (values never leave the machine).
 *   2. Generates the ZK proof via the configured proof server.
 *   3. Has the connected wallet (Lace / 1AM via the DApp Connector API)
 *      balance, sign, and pay fees for the transaction.
 *   4. Relays the sealed transaction to Midnight Preview through the wallet.
 *   5. Waits for the transaction to be finalized and returns the REAL
 *      transaction hash and contract address.
 *
 * On-chain public state (isAuthentic, verificationCount, thresholds) is read
 * from the Midnight indexer — the same data any third-party observer sees.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { getNetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as CompiledContract from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import {
  Transaction,
  type FinalizedTransaction,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';

/** Proven, unbalanced transaction (unsigned, pre-binding) — wallet input. */
type UnboundTransaction = Transaction<any, any, any>;
import type { MidnightProviders, ProofProvider } from '@midnight-ntwrk/midnight-js-types';
import {
  fromHex,
  parseCoinPublicKeyToHex,
  parseEncPublicKeyToHex,
  toHex,
} from '@midnight-ntwrk/midnight-js-utils';
import { Contract as CompiledCreatorAuthenticity, ledger as decodeLedger } from '@managed/contract';
import type { AppEnvironment, CreatorPrivateMetrics, MidnightWalletConnector } from '@/types';
import { FetchZkConfigProvider } from '@/utils/zkConfigProvider';

const PRIVATE_STATE_ID = 'creator-authenticity-ledger';

/** The contract makes no use of private state; an empty object is the stored state. */
const INITIAL_PRIVATE_STATE = {};

// ── Provider bundle ───────────────────────────────────────────────────────────

/**
 * Builds the full set of Midnight providers for a browser dApp session.
 *
 * - proofProvider:       ZK proof generation via the configured proof server.
 * - publicDataProvider:  on-chain reads via the Midnight indexer.
 * - privateStateProvider: encrypted local (IndexedDB) private-state storage.
 * - walletProvider / midnightProvider: backed by the connected wallet through
 *   the DApp Connector API — the wallet balances, signs, pays fees, and
 *   relays every transaction.
 */
export function buildProviders(
  connector: MidnightWalletConnector,
  env: AppEnvironment,
  hooks?: {
    onProving?: () => void;
    onBalancing?: () => void;
    onSubmitted?: () => void;
  },
): MidnightProviders {
  setNetworkId(env.network);

  const zkConfigProvider = new FetchZkConfigProvider('/');
  const proofProvider = httpClientProofProvider(env.proofServerUrl, zkConfigProvider);
  const publicDataProvider = indexerPublicDataProvider(env.indexerUrl, env.indexerWsUrl);
  const privateStateProvider = levelPrivateStateProvider({
    privateStoragePasswordProvider: () =>
      import.meta.env.VITE_PRIVATE_STATE_PASSWORD || 'CreatorAuthLedger-Preview-2026!',
    accountId: 'browser-dapp',
  });

  const walletProvider = {
    getCoinPublicKey: (): string => {
      throw new Error('Coin public key must be provided via withWalletKeys()');
    },
    getEncryptionPublicKey: (): string => {
      throw new Error('Encryption public key must be provided via withWalletKeys()');
    },
    balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
      hooks?.onBalancing?.();
      // Unsealed = proven, unsigned, pre-binding — exactly what the wallet expects.
      const { tx: sealedTxHex } = await connector.balanceUnsealedTransaction(toHex(tx.serialize()), {
        payFees: true,
      });
      return deserializeSealedTx(sealedTxHex);
    },
  };

  const midnightProvider = {
    submitTx: async (tx: FinalizedTransaction): Promise<string> => {
      hooks?.onSubmitted?.();
      await connector.submitTransaction(toHex(tx.serialize()));
      return tx.transactionHash();
    },
  };

  const instrumentedProofProvider = {
    // Wraps the HTTP proof provider so the UI can show the real
    // "generating proof" phase when the proof server is contacted.
    proveTx: async (unprovenTx: any, config?: any) => {
      hooks?.onProving?.();
      return (proofProvider as ProofProvider).proveTx(unprovenTx, config);
    },
  };

  return {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider: instrumentedProofProvider,
    walletProvider,
    midnightProvider,
  } as unknown as MidnightProviders;
}

function deserializeSealedTx(hex: string): FinalizedTransaction {
  return Transaction.deserialize('signature', 'proof', 'binding', fromHex(hex)) as any;
}

/**
 * Attaches the connected wallet's public keys to the provider bundle. The
 * shielded coin/encryption public keys come from the wallet via the DApp
 * Connector and are required for transaction construction.
 */
async function withWalletKeys(
  providers: MidnightProviders,
  connector: MidnightWalletConnector,
): Promise<MidnightProviders> {
  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } =
    await connector.getShieldedAddresses();
  const networkId = getNetworkId();
  const coinPublicKey = parseCoinPublicKeyToHex(shieldedCoinPublicKey, networkId);
  const encryptionPublicKey = parseEncPublicKeyToHex(shieldedEncryptionPublicKey, networkId);

  return {
    ...providers,
    walletProvider: {
      ...providers.walletProvider,
      getCoinPublicKey: () => coinPublicKey,
      getEncryptionPublicKey: () => encryptionPublicKey,
    },
  } as unknown as MidnightProviders;
}

// ── Compiled contract binding ─────────────────────────────────────────────────

/**
 * Builds the Compact compiled-contract binding with live witnesses. The
 * witness callbacks read the creator's private metrics and are executed
 * locally inside the ZK circuit — the raw values are never transmitted.
 */
function buildCompiledContract(metrics: CreatorPrivateMetrics): any {
  const witnesses = {
    followerCount:           (ctx: { privateState: unknown }) => [ctx.privateState, BigInt(metrics.followerCount)],
    genuineEngagementCount:  (ctx: { privateState: unknown }) => [ctx.privateState, BigInt(metrics.genuineEngagementCount)],
    postingConsistencyScore: (ctx: { privateState: unknown }) => [ctx.privateState, BigInt(metrics.postingConsistencyScore)],
    verifiedAudienceScore:   (ctx: { privateState: unknown }) => [ctx.privateState, BigInt(metrics.verifiedAudienceScore)],
  };

  // The contract executes against ZK artifacts supplied by the
  // FetchZkConfigProvider, so no compiled-asset file path is needed.
  const compiled = CompiledContract.CompiledContract.make(
    'creator-authenticity-ledger',
    CompiledCreatorAuthenticity as any,
  );
  return (CompiledContract.CompiledContract.withWitnesses as any)(compiled, witnesses);
}

/**
 * Verifies the proof server answers before starting the multi-step prove
 * flow. Any HTTP response (even 404 on /) proves reachability; a rejected
 * fetch means the browser could not reach it at all (container not started,
 * wrong port mapping, or blocked cross-origin).
 */
async function assertProofServerReachable(proofServerUrl: string): Promise<void> {
  try {
    await fetch(proofServerUrl, { method: 'GET' });
  } catch {
    throw new Error(
      `Proof server at ${proofServerUrl} is not reachable from the browser. ` +
      'Quick check: open ' + proofServerUrl + ' in a new browser tab. ' +
      'If the tab fails to load, the server is not running — start it with: ' +
      'docker run -d -p 6300:6300 midnightntwrk/proof-server:8.0.3 ' +
      '(the container listens on port 6300 — the host port must map to it). ' +
      'If the tab DOES load, the server is up but this browser is blocking requests ' +
      'to localhost from an HTTPS page — test the verify flow from http://localhost:3000 ' +
      '(npm run dev), or point VITE_PROOF_SERVER_URL at a public HTTPS proof server.',
    );
  }
}

// ── Real verification flow ────────────────────────────────────────────────────

export interface OnChainProveResult {
  success: boolean;
  txHash: string | null;
  contractAddress: string;
  error: string | null;
}

/**
 * Walks the whole error cause chain and extracts every detail that survived
 * the extension boundary (name, message, stack head, extra own properties).
 * Wallet-relayed errors often arrive with an empty message — the stack or
 * attached properties are then the only clue to which step failed.
 */
function dumpErrorDetails(err: unknown, depth = 0): string {
  if (err == null || depth > 5) return '';
  const parts: string[] = [];
  if (err instanceof Error) {
    parts.push(err.name || 'Error');
    parts.push(err.message || '(no message)');
    if (err.stack) {
      const frames = err.stack.split('\n').slice(1, 3).join(' | ').trim();
      if (frames) parts.push(`at ${frames}`);
    }
    parts.push(dumpErrorDetails((err as { cause?: unknown }).cause, depth + 1));
  } else {
    try {
      const extras = Object.getOwnPropertyNames(err as object)
        .map(k => `${k}=${String((err as Record<string, unknown>)[k]).slice(0, 200)}`)
        .join(', ');
      parts.push(JSON.stringify(err) || extras);
    } catch {
      parts.push(String(err));
    }
  }
  return parts.filter(Boolean).join(' :: ');
}

/**
 * Translates low-level SDK / wallet errors into actionable messages.
 */
function friendlyProveError(err: unknown): string {
  const details = dumpErrorDetails(err);
  // Always keep the full trace in the console for debugging.
  console.error('[onchain] verification failure details:', details, err);

  const haystack = details;
  if (/RemoteApiShutdown|was shutdown|object can no longer be used/i.test(haystack)) {
    return 'The wallet connection dropped mid-transaction (the extension restarted its ' +
      'background process). Reconnect the wallet and try again — the proof server and ' +
      'chain connection are fine.';
  }
  if (/insufficient|InsufficientFunds|not enough/i.test(haystack)) {
    return 'The wallet does not have enough DUST to pay the transaction fees. ' +
      'Get Preview DUST from the Midnight faucet for this wallet address and retry.';
  }
  if (/Failed to fetch|NetworkError|network error/i.test(haystack)) {
    return 'A network call failed mid-flow. Check that the proof server ' +
      '(http://localhost:6300) is still running and that the indexer is reachable.';
  }
  if (/PermissionRejected|Rejected by|user rejected|denied/i.test(haystack)) {
    return 'The transaction was rejected in the wallet.';
  }
  if (/^\s*Error\s*::?\s*\(no message\)/i.test(details) || details === 'Error :: (no message)') {
    return 'The wallet relay failed without details (the extension swallowed the cause). ' +
      'Most common causes: this wallet has no Preview DUST to pay fees, or the wallet\'s ' +
      'node connection is down. Check the balance in Lace, top up from the Midnight faucet ' +
      'if needed, and retry. Full trace: open DevTools → Console.';
  }
  return details || 'Unknown on-chain error';
}

function isStaleWalletChannel(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /RemoteApiShutdown|was shutdown|object can no longer be used/i.test(msg);
}

/**
 * Submits a real proveAuthenticity() call transaction against the deployed
 * contract and waits for it to be finalized on Midnight.
 *
 * If the wallet's background process dies mid-transaction (RemoteApiShutdownError —
 * a known extension lifecycle quirk), and a `reconnect` callback is supplied,
 * the whole flow is retried once with a freshly connected wallet.
 */
export async function proveCreatorAuthenticityOnChain(
  connector: MidnightWalletConnector,
  env: AppEnvironment,
  metrics: CreatorPrivateMetrics,
  onStepChange: (step: string) => void,
  opts?: { reconnect?: () => Promise<MidnightWalletConnector> },
): Promise<OnChainProveResult> {
  const attempt = async (activeConnector: MidnightWalletConnector): Promise<OnChainProveResult> => {
    onStepChange('preparing');
    await assertProofServerReachable(env.proofServerUrl);
    const providers = await withWalletKeys(
      buildProviders(activeConnector, env, {
        onProving: () => onStepChange('generating_proof'),
        onBalancing: () => onStepChange('submitting'),
        onSubmitted: () => onStepChange('confirmed'),
      }),
      activeConnector,
    );

    const compiledContract = buildCompiledContract(metrics);
    // findDeployedContract also verifies the local ZK artifacts against the
    // deployed contract's on-chain verifier keys, so a successful return here
    // means the app is pointed at the right contract.
    const found = await findDeployedContract(providers as any, {
      compiledContract,
      contractAddress: env.contractAddress,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: INITIAL_PRIVATE_STATE,
    } as any);
    // midnight-js v4 exposes the call interface directly on the found contract.
    const callTx = (found as any).callTx as {
      proveAuthenticity: () => Promise<{ public: { txHash: string } }>;
    };

    // Locally executes the circuit, generates the ZK proof, has the wallet
    // balance + sign + pay fees, relays through the wallet, and waits for
    // finalization. Step callbacks fire from the instrumented providers.
    onStepChange('executing_circuit');
    const callResult = await callTx.proveAuthenticity();

    onStepChange('verified');
    return {
      success: true,
      txHash: callResult.public.txHash,
      contractAddress: env.contractAddress,
      error: null,
    };
  };

  try {
    return await attempt(connector);
  } catch (err) {
    // The wallet extension's background process can restart mid-flow and
    // invalidate the connected channel. Reconnect once and retry.
    if (isStaleWalletChannel(err) && opts?.reconnect) {
      try {
        const fresh = await opts.reconnect();
        return await attempt(fresh);
      } catch (retryErr) {
        return {
          success: false,
          txHash: null,
          contractAddress: env.contractAddress,
          error: friendlyProveError(retryErr),
        };
      }
    }
    return {
      success: false,
      txHash: null,
      contractAddress: env.contractAddress,
      error: friendlyProveError(err),
    };
  }
}

// ── Real on-chain state reads ─────────────────────────────────────────────────

export interface OnChainContractState {
  verificationId: string;
  isAuthentic: boolean;
  minEngagementBps: bigint;
  minConsistency: bigint;
  minAudienceScore: bigint;
  verificationCount: number;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Reads the contract's public ledger state from the Midnight indexer and
 * decodes it with the compiled contract's ledger decoder. This is the same
 * public state any blockchain observer can see.
 */
export async function readOnChainState(
  env: AppEnvironment,
): Promise<OnChainContractState | null> {
  setNetworkId(env.network);
  const publicDataProvider = indexerPublicDataProvider(env.indexerUrl, env.indexerWsUrl);
  const contractState = await publicDataProvider.queryContractState(env.contractAddress as any);
  if (!contractState) return null;

  const ledgerState = decodeLedger((contractState as any).data);
  return {
    verificationId: bytesToHex(ledgerState.verificationId).replace(/\0+$/, ''),
    isAuthentic: ledgerState.isAuthentic,
    minEngagementBps: ledgerState.minEngagementBps,
    minConsistency: ledgerState.minConsistency,
    minAudienceScore: ledgerState.minAudienceScore,
    verificationCount: Number(ledgerState.verificationCount),
  };
}
