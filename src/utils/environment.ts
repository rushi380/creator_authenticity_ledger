import type { AppEnvironment, AuthenticityThresholds } from '@/types';
import deployment from '../../deployment.json';

/**
 * Read a Vite env var, treating blank strings (e.g. an env var defined in the
 * hosting dashboard with no value) as unset so the fallback applies.
 */
function envOr(value: string | undefined, fallback: string): string {
  const v = (value ?? '').trim();
  return v.length > 0 ? v : fallback;
}

function intEnv(value: string | undefined, fallback: number): number {
  const n = parseInt((value ?? '').trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function getEnvironment(): AppEnvironment {
  const network = envOr(import.meta.env.VITE_NETWORK, deployment.network ?? 'preview');
  // The deployed contract address. Falls back to deployment.json (written by
  // the deploy script) when VITE_CONTRACT_ADDRESS is not set at build time.
  const contractAddress = envOr(
    import.meta.env.VITE_CONTRACT_ADDRESS,
    deployment.contractAddress ?? '',
  );
  const proofServerUrl = envOr(
    import.meta.env.VITE_PROOF_SERVER_URL,
    'http://localhost:6300',
  );
  const indexerUrl = envOr(
    import.meta.env.VITE_INDEXER_URL,
    'https://indexer.preview.midnight.network/api/v4/graphql',
  );
  const indexerWsUrl = envOr(
    import.meta.env.VITE_INDEXER_WS_URL,
    'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  );
  const nodeUrl = envOr(
    import.meta.env.VITE_NODE_URL,
    'https://rpc.preview.midnight.network',
  );

  const thresholds: AuthenticityThresholds = {
    minEngagementBps: intEnv(
      import.meta.env.VITE_MIN_ENGAGEMENT_BPS,
      Number(deployment.thresholds?.minEngagementBps ?? 300),
    ),
    minConsistency: intEnv(
      import.meta.env.VITE_MIN_CONSISTENCY,
      Number(deployment.thresholds?.minConsistency ?? 60),
    ),
    minAudienceScore: intEnv(
      import.meta.env.VITE_MIN_AUDIENCE_SCORE,
      Number(deployment.thresholds?.minAudienceScore ?? 70),
    ),
  };

  return { network, contractAddress, proofServerUrl, indexerUrl, indexerWsUrl, nodeUrl, thresholds };
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
