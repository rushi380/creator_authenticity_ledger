import type { AppEnvironment, AuthenticityThresholds } from '@/types';

export function getEnvironment(): AppEnvironment {
  const network = import.meta.env.VITE_NETWORK ?? 'preview';
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS ?? '';
  const proofServerUrl = import.meta.env.VITE_PROOF_SERVER_URL ?? 'http://localhost:6300';
  const indexerUrl = import.meta.env.VITE_INDEXER_URL ?? 'https://indexer.preview.midnight.network/api/v4/graphql';
  const nodeUrl = import.meta.env.VITE_NODE_URL ?? 'https://rpc.preview.midnight.network';

  const thresholds: AuthenticityThresholds = {
    minEngagementBps: parseInt(import.meta.env.VITE_MIN_ENGAGEMENT_BPS ?? '300', 10),
    minConsistency:   parseInt(import.meta.env.VITE_MIN_CONSISTENCY ?? '60', 10),
    minAudienceScore: parseInt(import.meta.env.VITE_MIN_AUDIENCE_SCORE ?? '70', 10),
  };

  return { network, contractAddress, proofServerUrl, indexerUrl, nodeUrl, thresholds };
}

export function formatEngagementRate(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function computeEngagementBps(
  genuineEngagementCount: number,
  followerCount: number
): number {
  if (followerCount === 0) return 0;
  return Math.floor((genuineEngagementCount * 10000) / followerCount);
}

export function formatAddress(address: string, chars = 8): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function getNetworkLabel(network: string): string {
  const labels: Record<string, string> = {
    preprod:    'Midnight Preprod',
    preview:    'Midnight Preview',
    undeployed: 'Local (Undeployed)',
  };
  return labels[network] ?? network;
}
