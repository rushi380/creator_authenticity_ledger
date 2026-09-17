/**
 * zkConfigProvider.ts
 *
 * Browser implementation of Midnight's ZKConfigProvider.
 *
 * The compiled ZK artifacts (ZKIR, prover keys, verifier keys) produced by
 * the Compact compiler are static files served by the app from /keys and
 * /zkir (see public/). This provider fetches them over HTTP, mirroring the
 * file layout that NodeZkConfigProvider reads from disk in deployment
 * scripts:
 *
 *   keys/<circuitId>.prover
 *   keys/<circuitId>.verifier
 *   zkir/<circuitId>.bzkir
 */

import {
  ZKConfigProvider,
  createProverKey,
  createVerifierKey,
  createZKIR,
  type ProverKey,
  type VerifierKey,
  type ZKIR,
} from '@midnight-ntwrk/midnight-js-types';

const KEY_DIR = 'keys';
const PROVER_EXT = '.prover';
const VERIFIER_EXT = '.verifier';
const ZKIR_DIR = 'zkir';
const ZKIR_EXT = '.bzkir';

export class FetchZkConfigProvider extends ZKConfigProvider<string> {
  private readonly baseUrl: string;

  constructor(baseUrl = '/') {
    super();
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }

  private async fetchArtifact(subDir: string, circuitId: string, ext: string): Promise<Uint8Array> {
    if (!/^[A-Za-z0-9_-]+$/.test(circuitId)) {
      throw new Error(`Invalid circuitId: ${JSON.stringify(circuitId)}`);
    }
    const url = `${this.baseUrl}${subDir}/${circuitId}${ext}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ZK artifact ${url}: ${response.status} ${response.statusText}`,
      );
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  getProverKey(circuitId: string): Promise<ProverKey> {
    return this.fetchArtifact(KEY_DIR, circuitId, PROVER_EXT).then(createProverKey);
  }

  getVerifierKey(circuitId: string): Promise<VerifierKey> {
    return this.fetchArtifact(KEY_DIR, circuitId, VERIFIER_EXT).then(createVerifierKey);
  }

  getZKIR(circuitId: string): Promise<ZKIR> {
    return this.fetchArtifact(ZKIR_DIR, circuitId, ZKIR_EXT).then(createZKIR);
  }
}
