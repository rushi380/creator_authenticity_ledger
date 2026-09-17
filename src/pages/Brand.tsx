import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, Input, Badge } from '@/components/ui';
import type { OnChainContractState } from '@/utils/onchain';
import { readOnChainState } from '@/utils/onchain';
import { getEnvironment, formatEngagementRate } from '@/utils/environment';

/**
 * Brand Verification Portal — reads the contract's real public ledger state
 * from the Midnight indexer. Only the binary authenticity result and public
 * counters are visible; private metrics are never part of the chain state.
 */
export function Brand() {
  const [contractAddr, setContractAddr] = useState('');
  const [lookupResult, setLookupResult] = useState<OnChainContractState | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const env = getEnvironment();

  useEffect(() => {
    // Default to the deployed contract so brands can check it immediately.
    if (!contractAddr && env.contractAddress) {
      setContractAddr(env.contractAddress);
    }
  }, [env.contractAddress, contractAddr]);

  const handleLookup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const address = contractAddr.trim();
      if (!address) return;

      setLoading(true);
      setNotFound(false);
      setLookupError(null);
      setLookupResult(null);

      try {
        const state = await readOnChainState({ ...env, contractAddress: address });
        if (state) {
          setLookupResult(state);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        setLookupError(
          err instanceof Error ? err.message : 'Failed to query the Midnight indexer'
        );
      } finally {
        setLoading(false);
      }
    },
    [contractAddr, env],
  );

  const result = lookupResult?.isAuthentic
    ? 'AUTHENTIC'
    : lookupResult && lookupResult.verificationCount > 0
    ? 'NOT_AUTHENTIC'
    : lookupResult
    ? 'PENDING'
    : 'UNKNOWN';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Brand Verification Portal
        </h1>
        <p className="text-gray-400">
          Look up a contract's on-chain authenticity verification state on Midnight.
          You receive only the binary result and public counters — private metrics
          are never part of the chain state.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lookup form */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white">Query On-Chain Verification</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="space-y-4">
                <Input
                  label="Contract Address"
                  value={contractAddr}
                  onChange={e => setContractAddr(e.target.value)}
                  placeholder={env.contractAddress || 'c0…'}
                  hint="Midnight contract address (hex)"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                  disabled={!contractAddr.trim()}
                >
                  Check Verification
                </Button>
              </form>

              <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-800/40">
                <p className="text-xs text-indigo-400">
                  Queries the live Midnight indexer — the same public state any
                  blockchain observer can read. No API keys, no trusted backend.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy notice */}
          <Card className="mt-4 border-violet-800/40">
            <CardContent className="py-4">
              <Badge variant="private" className="mb-3">Privacy Guarantee</Badge>
              <p className="text-sm text-gray-400">
                The verification result tells you only whether the creator passed
                the authenticity thresholds. Their follower count, engagement
                figures, and other private metrics are protected by Midnight's
                zero-knowledge architecture and are permanently hidden from this view.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                <p>🔒 Follower count: <span className="font-mono">████████████</span></p>
                <p>🔒 Engagement data: <span className="font-mono">████████████</span></p>
                <p>🔒 Audience score: <span className="font-mono">████████████</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Result */}
        <div>
          {notFound && (
            <Card>
              <CardContent className="text-center py-10">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-white font-semibold">No Contract Found</p>
                <p className="text-gray-400 text-sm mt-2">
                  No on-chain state found for that contract address. Verify the
                  address and network (Midnight Preview).
                </p>
              </CardContent>
            </Card>
          )}

          {lookupError && (
            <Card className="border-red-800/50">
              <CardContent className="py-8 text-center">
                <p className="text-red-400 text-sm font-medium">Indexer query failed</p>
                <p className="text-red-300 text-xs mt-2 break-all">{lookupError}</p>
              </CardContent>
            </Card>
          )}

          {lookupResult && (
            <Card className={`overflow-hidden ${
              result === 'AUTHENTIC'
                ? 'border-emerald-800/50'
                : result === 'NOT_AUTHENTIC'
                ? 'border-red-800/50'
                : 'border-amber-800/50'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold font-mono text-xs">
                    {env.contractAddress === contractAddr.trim() ? 'Deployed Contract' : 'Contract'}
                  </span>
                  <Badge variant={
                    result === 'AUTHENTIC' ? 'success' :
                    result === 'NOT_AUTHENTIC' ? 'error' : 'warning'
                  }>
                    {result}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Big result */}
                <div className={`rounded-xl p-6 text-center mb-5 ${
                  result === 'AUTHENTIC'
                    ? 'bg-emerald-500/10 border border-emerald-800/50'
                    : result === 'NOT_AUTHENTIC'
                    ? 'bg-red-500/10 border border-red-800/50'
                    : 'bg-amber-500/10 border border-amber-800/50'
                }`}>
                  <div className="text-5xl mb-2">
                    {result === 'AUTHENTIC'    ? '✅' :
                     result === 'NOT_AUTHENTIC' ? '❌' : '⏳'}
                  </div>
                  <p className={`text-xl font-bold ${
                    result === 'AUTHENTIC'    ? 'text-emerald-400' :
                    result === 'NOT_AUTHENTIC' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {result === 'AUTHENTIC'    ? 'AUTHENTIC ✓' :
                     result === 'NOT_AUTHENTIC' ? 'NOT AUTHENTIC ✗' :
                     'VERIFICATION PENDING'}
                  </p>
                </div>

                {/* Metadata — real on-chain values */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network</span>
                    <span className="text-white font-medium capitalize">{env.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verifications Recorded</span>
                    <span className="text-white">{lookupResult.verificationCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min. Engagement (on-chain)</span>
                    <span className="text-white">{formatEngagementRate(Number(lookupResult.minEngagementBps))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min. Consistency (on-chain)</span>
                    <span className="text-white">{Number(lookupResult.minConsistency)}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min. Audience (on-chain)</span>
                    <span className="text-white">{Number(lookupResult.minAudienceScore)}/100</span>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Contract</p>
                    <p className="font-mono text-xs text-gray-300 break-all">{contractAddr.trim()}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-800">
                    <p className="text-xs text-violet-400 text-center">
                      🔒 Private data: Protected by Midnight ZK privacy
                    </p>
                    <p className="text-xs text-gray-600 text-center mt-1">
                      Raw engagement metrics are cryptographically hidden.
                      The verification result is the only public output.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!lookupResult && !notFound && !lookupError && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-5xl mb-4">🏷️</div>
                <p className="text-gray-400 text-sm">
                  Enter a contract address to read its authenticity verification
                  state directly from the Midnight blockchain.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin w-10 h-10 text-violet-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-gray-400 text-sm">Querying Midnight ledger…</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Thresholds reference */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Public Authenticity Thresholds</h2>
            <Badge variant="info">On-Chain Configuration</Badge>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            These are the minimum thresholds a creator must satisfy for verification to pass.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-gray-800/50">
              <p className="text-2xl font-bold text-violet-400">
                {(env.thresholds.minEngagementBps / 100).toFixed(2)}%
              </p>
              <p className="text-sm text-gray-400 mt-1">Minimum Engagement Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/50">
              <p className="text-2xl font-bold text-violet-400">{env.thresholds.minConsistency}/100</p>
              <p className="text-sm text-gray-400 mt-1">Minimum Consistency Score</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/50">
              <p className="text-2xl font-bold text-violet-400">{env.thresholds.minAudienceScore}/100</p>
              <p className="text-sm text-gray-400 mt-1">Minimum Audience Score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
