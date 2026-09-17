// ─────────────────────────────────────────────────────────────────────────────
// Type definitions for Creator Authenticity Ledger
// ─────────────────────────────────────────────────────────────────────────────

// Wallet connection state
export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  apiVersion: string;
}

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  balance: string | null;
  network: string | null;
  error: string | null;
  walletId: string | null;
  walletName: string | null;
}

export interface MidnightWalletAPI {
  /** Reverse-DNS wallet identifier required by DApp Connector API v4. */
  rdns?: string;
  connect: (network: string) => Promise<MidnightWalletConnector>;
  apiVersion: string;
  name: string;
  icon: string;
}

export interface MidnightWalletConnector {
  getUnshieldedAddress: () => Promise<{ unshieldedAddress: string }>;
  getUnshieldedBalances: () => Promise<Record<string, bigint>>;
  getDustBalance: () => Promise<{ cap: bigint; balance: bigint }>;
  getConfiguration: () => Promise<{ networkId: string }>;
  submitTransaction: (tx: unknown) => Promise<string>;
}

export interface WindowMidnight {
  [key: string]: MidnightWalletAPI;
}

// Creator private inputs (NEVER sent to the chain)
export interface CreatorPrivateMetrics {
  followerCount: number;           // Total follower count
  genuineEngagementCount: number;  // Verified genuine interactions
  postingConsistencyScore: number; // 0-100 scale
  verifiedAudienceScore: number;   // 0-100 scale
}

// Public verification thresholds (on-chain config)
export interface AuthenticityThresholds {
  minEngagementBps: number;   // Basis points e.g. 300 = 3.00%
  minConsistency: number;     // 0-100
  minAudienceScore: number;   // 0-100
}

// Contract on-chain public state
export interface ContractPublicState {
  verificationId: string;
  isAuthentic: boolean;
  minEngagementBps: bigint;
  minConsistency: bigint;
  minAudienceScore: bigint;
  verificationCount: number;
}

// Verification flow state machine
export type VerificationStep =
  | 'idle'
  | 'preparing'
  | 'generating_proof'
  | 'executing_circuit'
  | 'submitting'
  | 'confirmed'
  | 'verified'
  | 'failed';

export interface VerificationState {
  step: VerificationStep;
  txHash: string | null;
  contractAddress: string | null;
  error: string | null;
  timestamp: number | null;
}

// Brand verification record
export interface BrandVerificationRecord {
  creatorHandle: string;
  contractAddress: string;
  verificationId: string;
  result: 'AUTHENTIC' | 'NOT_AUTHENTIC' | 'PENDING' | 'UNKNOWN';
  timestamp: number;
  network: string;
}

// Compact contract witness provider interface
export interface CreatorWitnessProvider {
  followerCount: () => Promise<bigint>;
  genuineEngagementCount: () => Promise<bigint>;
  postingConsistencyScore: () => Promise<bigint>;
  verifiedAudienceScore: () => Promise<bigint>;
}

// Contract deployment result
export interface DeploymentResult {
  contractAddress: string;
  txHash: string;
  network: string;
  deployedAt: string;
  thresholds: AuthenticityThresholds;
}

// Environment configuration
export interface AppEnvironment {
  network: string;
  contractAddress: string;
  proofServerUrl: string;
  indexerUrl: string;
  nodeUrl: string;
  thresholds: AuthenticityThresholds;
}
