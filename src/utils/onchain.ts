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

// ── Real verification flow ────────────────────────────────────────────────────

export interface OnChainProveResult {
  success: boolean;
  txHash: string | null;
  contractAddress: string;
  error: string | null;
}

/**
 * Submits a real proveAuthenticity() call transaction against the deployed
 * contract and waits for it to be finalized on Midnight.
 */
export async function proveCreatorAuthenticityOnChain(
  connector: MidnightWalletConnector,
  env: AppEnvironment,
  metrics: CreatorPrivateMetrics,
  onStepChange: (step: string) => void,
): Promise<OnChainProveResult> {
  try {
    onStepChange('preparing');
    const providers = await withWalletKeys(
      buildProviders(connector, env, {
        onProving: () => onStepChange('generating_proof'),
        onBalancing: () => onStepChange('submitting'),
        onSubmitted: () => onStepChange('confirmed'),
      }),
      connector,
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown on-chain error';
    return {
      success: false,
      txHash: null,
      contractAddress: env.contractAddress,
      error: msg,
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
