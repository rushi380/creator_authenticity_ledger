/**
 * providers.ts
 *
 * Midnight SDK provider setup.
 * Configures proof server, indexer, and node connections.
 */

import { getEnvironment } from './environment';

export interface MidnightProviders {
  proofServerUrl: string;
  indexerUrl: string;
  nodeUrl: string;
  network: string;
}

export function getMidnightProviders(): MidnightProviders {
  const env = getEnvironment();
  return {
    proofServerUrl: env.proofServerUrl,
    indexerUrl: env.indexerUrl,
    nodeUrl: env.nodeUrl,
    network: env.network,
  };
}

export function getProofServerStatus(): Promise<'online' | 'offline'> {
  const env = getEnvironment();
  return fetch(`${env.proofServerUrl}/health`, { signal: AbortSignal.timeout(3000) })
    .then(r => r.ok ? 'online' : 'offline')
    .catch(() => 'offline');
}
