/**
 * contract_interface.ts
 *
 * This file documents the TypeScript interface that the Compact compiler
 * generates for creator_authenticity.compact.
 *
 * After running: compact compile contracts/creator_authenticity.compact ./managed
 * the real generated file replaces this stub.
 *
 * Circuits exposed by the contract:
 *   - proveAuthenticity()   — main ZK proof circuit
 *   - resetVerification()   — reset the on-chain state
 *
 * Ledger state (public, on-chain):
 *   - verificationId:    Bytes<32>
 *   - isAuthentic:       Boolean
 *   - minEngagementBps:  Uint<64>
 *   - minConsistency:    Uint<64>
 *   - minAudienceScore:  Uint<64>
 *   - verificationCount: Uint<32>
 *
 * Witnesses (private, never on-chain):
 *   - followerCount():           Uint<64>
 *   - genuineEngagementCount():  Uint<64>
 *   - postingConsistencyScore(): Uint<64>
 *   - verifiedAudienceScore():   Uint<64>
 */

// ── Generated contract state type ─────────────────────────────────────────────
export interface CreatorAuthenticityLedger {
  verificationId:    Uint8Array;   // Bytes<32>
  isAuthentic:       boolean;
  minEngagementBps:  bigint;       // Uint<64>
  minConsistency:    bigint;       // Uint<64>
  minAudienceScore:  bigint;       // Uint<64>
  verificationCount: number;       // Uint<32>
}

// ── Witness provider interface ────────────────────────────────────────────────
export interface CreatorAuthenticityWitnesses {
  followerCount:           () => Promise<bigint>;
  genuineEngagementCount:  () => Promise<bigint>;
  postingConsistencyScore: () => Promise<bigint>;
  verifiedAudienceScore:   () => Promise<bigint>;
}

// ── Constructor arguments ─────────────────────────────────────────────────────
export interface CreatorAuthenticityConstructorArgs {
  _verificationId:   Uint8Array;  // Bytes<32>
  _minEngagementBps: bigint;      // Uint<64>
  _minConsistency:   bigint;      // Uint<64>
  _minAudienceScore: bigint;      // Uint<64>
}

// ── Contract name (used by Midnight JS SDK) ───────────────────────────────────
export const CONTRACT_NAME = 'creator_authenticity';
export const CIRCUIT_PROVE = 'proveAuthenticity';
export const CIRCUIT_RESET = 'resetVerification';
