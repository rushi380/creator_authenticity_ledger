import React, { useState } from 'react';
import { Button, Card, CardContent, CardHeader, Input, Badge } from '@/components/ui';
import type { BrandVerificationRecord } from '@/types';
import { getEnvironment } from '@/utils/environment';

const DEMO_RECORDS: BrandVerificationRecord[] = [
  {
    creatorHandle: '@creator_demo',
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || 'AWAITING_DEPLOYMENT',
    verificationId: 'ver_demo_001',
    result: 'AUTHENTIC',
    timestamp: Date.now() - 3600000,
    network: 'preprod',
  },
];

export function Brand() {
  const [handle, setHandle] = useState('');
  const [contractAddr, setContractAddr] = useState('');
  const [lookupResult, setLookupResult] = useState<BrandVerificationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const env = getEnvironment();

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setLookupResult(null);

    // Simulate network lookup delay
    await new Promise(r => setTimeout(r, 1200));

    // Match against demo records or deployed contract
    const match = DEMO_RECORDS.find(r =>
      r.creatorHandle.toLowerCase() === handle.toLowerCase() ||
      r.contractAddress.toLowerCase() === contractAddr.toLowerCase()
    );

    if (match) {
      setLookupResult(match);
    } else if (env.contractAddress && contractAddr === env.contractAddress) {
      // Simulate reading on-chain state
      setLookupResult({
        creatorHandle: handle || '@unknown',
        contractAddress: env.contractAddress,
        verificationId: 'live',
        result: 'PENDING',
        timestamp: Date.now(),
        network: env.network,
      });
    } else {
      setNotFound(true);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Brand Verification Portal
        </h1>
        <p className="text-gray-400">
          Look up a creator's on-chain authenticity verification record.
          You'll receive only the binary result — private metrics remain hidden.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lookup form */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white">Look Up Creator Verification</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="space-y-4">
                <Input
                  label="Creator Handle"
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  placeholder="@creator_demo"
                  hint="Creator's social handle"
                />
                <Input
                  label="Contract Address (optional)"
                  value={contractAddr}
                  onChange={e => setContractAddr(e.target.value)}
                  placeholder="0x…"
                  hint="Midnight Preprod contract address"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                  disabled={!handle && !contractAddr}
                >
                  Check Verification
                </Button>
              </form>

              {/* Demo hint */}
              <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-800/40">
                <p className="text-xs text-indigo-400">
                  <strong>Demo:</strong> Try handle <code className="font-mono">@creator_demo</code>
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
                <p className="text-white font-semibold">No Record Found</p>
                <p className="text-gray-400 text-sm mt-2">
                  No verification record found for that creator or contract address.
                </p>
              </CardContent>
            </Card>
          )}

          {lookupResult && (
            <Card className={`overflow-hidden ${
              lookupResult.result === 'AUTHENTIC'
                ? 'border-emerald-800/50'
                : lookupResult.result === 'NOT_AUTHENTIC'
                ? 'border-red-800/50'
                : 'border-amber-800/50'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{lookupResult.creatorHandle}</span>
                  <Badge variant={
                    lookupResult.result === 'AUTHENTIC' ? 'success' :
                    lookupResult.result === 'NOT_AUTHENTIC' ? 'error' : 'warning'
                  }>
                    {lookupResult.result}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Big result */}
                <div className={`rounded-xl p-6 text-center mb-5 ${
                  lookupResult.result === 'AUTHENTIC'
                    ? 'bg-emerald-500/10 border border-emerald-800/50'
                    : lookupResult.result === 'NOT_AUTHENTIC'
                    ? 'bg-red-500/10 border border-red-800/50'
                    : 'bg-amber-500/10 border border-amber-800/50'
                }`}>
                  <div className="text-5xl mb-2">
                    {lookupResult.result === 'AUTHENTIC'    ? '✅' :
                     lookupResult.result === 'NOT_AUTHENTIC' ? '❌' : '⏳'}
                  </div>
                  <p className={`text-xl font-bold ${
                    lookupResult.result === 'AUTHENTIC'    ? 'text-emerald-400' :
                    lookupResult.result === 'NOT_AUTHENTIC' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {lookupResult.result === 'AUTHENTIC'    ? 'AUTHENTIC ✓' :
                     lookupResult.result === 'NOT_AUTHENTIC' ? 'NOT AUTHENTIC ✗' :
                     'VERIFICATION PENDING'}
                  </p>
                </div>

                {/* Metadata */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network</span>
                    <span className="text-white font-medium capitalize">{lookupResult.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verified At</span>
                    <span className="text-white">
                      {new Date(lookupResult.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Contract</p>
                    <p className="font-mono text-xs text-gray-300 break-all">
                      {lookupResult.contractAddress}
                    </p>
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

          {!lookupResult && !notFound && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-5xl mb-4">🏷️</div>
                <p className="text-gray-400 text-sm">
                  Enter a creator handle or contract address to look up their
                  authenticity verification record.
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
