import React, { useState } from 'react';
import { Button, Card, CardContent, CardHeader, Input, Badge } from '@/components/ui';
import { WalletStatus } from '@/components/WalletStatus';
import { VerificationSteps } from '@/components/VerificationSteps';
import { PrivacyFlow } from '@/components/PrivacyFlow';
import type { WalletState, CreatorPrivateMetrics } from '@/types';
import { useVerification } from '@/hooks/useVerification';
import { getEnvironment, formatEngagementRate, computeEngagementBps } from '@/utils/environment';

interface VerifyProps {
  walletState: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
}

const INITIAL_METRICS: CreatorPrivateMetrics = {
  followerCount: 0,
  genuineEngagementCount: 0,
  postingConsistencyScore: 0,
  verifiedAudienceScore: 0,
};

export function Verify({ walletState, onConnect, onDisconnect }: VerifyProps) {
  const [metrics, setMetrics] = useState<CreatorPrivateMetrics>(INITIAL_METRICS);
  const [errors, setErrors] = useState<Partial<Record<keyof CreatorPrivateMetrics, string>>>({});
  const { verificationState, prove, reset, isProcessing, isVerified, isFailed } = useVerification();
  const env = getEnvironment();

  function handleChange(field: keyof CreatorPrivateMetrics, value: string) {
    const num = parseInt(value, 10);
    setMetrics(prev => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof CreatorPrivateMetrics, string>> = {};
    if (metrics.followerCount <= 0) newErrors.followerCount = 'Must be greater than 0';
    if (metrics.genuineEngagementCount < 0) newErrors.genuineEngagementCount = 'Must be 0 or greater';
    if (metrics.genuineEngagementCount > metrics.followerCount) {
      newErrors.genuineEngagementCount = 'Cannot exceed follower count';
    }
    if (metrics.postingConsistencyScore < 0 || metrics.postingConsistencyScore > 100) {
      newErrors.postingConsistencyScore = 'Must be between 0 and 100';
    }
    if (metrics.verifiedAudienceScore < 0 || metrics.verifiedAudienceScore > 100) {
      newErrors.verifiedAudienceScore = 'Must be between 0 and 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await prove(metrics);
  }

  const liveEngagementBps = computeEngagementBps(metrics.genuineEngagementCount, metrics.followerCount);
  const meetsEngagement = liveEngagementBps >= env.thresholds.minEngagementBps;

  if (isVerified) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30
          flex items-center justify-center mx-auto mb-6 animate-glow">
          <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Authenticity Cryptographically Verified
        </h1>
        <p className="text-gray-400 mb-8">
          Your creator authenticity has been proven using a zero-knowledge proof.
          The verification result is recorded on Midnight Preprod.
        </p>

        {/* What's public — what's hidden */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
          <Card className="border-emerald-800/40">
            <CardContent>
              <Badge variant="success" className="mb-3">On-Chain (Public)</Badge>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Authenticity: <strong className="text-emerald-400">VERIFIED</strong></li>
                {verificationState.contractAddress && (
                  <li>✓ Contract: <span className="font-mono text-xs text-gray-400">
                    {verificationState.contractAddress.slice(0, 12)}…
                  </span></li>
                )}
                <li>✓ Timestamp: {new Date(verificationState.timestamp!).toLocaleString()}</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-violet-800/40">
            <CardContent>
              <Badge variant="private" className="mb-3">🔒 Private (Hidden)</Badge>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>🔒 Follower count: <strong>████████</strong></li>
                <li>🔒 Engagement data: <strong>████████</strong></li>
                <li>🔒 Consistency score: <strong>████████</strong></li>
                <li>🔒 Audience score: <strong>████████</strong></li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {verificationState.txHash && (
          <div className="mb-6 p-4 rounded-xl bg-gray-900/80 border border-gray-700 text-left">
            <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
            <p className="font-mono text-xs text-gray-300 break-all">{verificationState.txHash}</p>
          </div>
        )}

        <Button variant="secondary" onClick={reset}>
          Verify Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Creator Authenticity Verification
        </h1>
        <p className="text-gray-400">
          Enter your private metrics below. They are used as ZK witnesses and
          <strong className="text-violet-400"> never transmitted to the blockchain</strong>.
        </p>
      </div>

      <WalletStatus
        walletState={walletState}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Private Creator Metrics</h2>
                  <Badge variant="private">🔒 Zero-Knowledge Inputs</Badge>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  These values are witness inputs to the ZK circuit. They prove the thresholds
                  are met without disclosing the actual values on-chain.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input
                  label="Follower Count"
                  type="number"
                  min="1"
                  value={metrics.followerCount || ''}
                  onChange={e => handleChange('followerCount', e.target.value)}
                  placeholder="e.g. 50000"
                  hint="Your total follower count across platforms"
                  error={errors.followerCount}
                  isPrivate
                />
                <Input
                  label="Genuine Engagement Count"
                  type="number"
                  min="0"
                  value={metrics.genuineEngagementCount || ''}
                  onChange={e => handleChange('genuineEngagementCount', e.target.value)}
                  placeholder="e.g. 2500"
                  hint="Verified genuine interactions (likes, comments, shares)"
                  error={errors.genuineEngagementCount}
                  isPrivate
                />
                <Input
                  label="Posting Consistency Score (0–100)"
                  type="number"
                  min="0"
                  max="100"
                  value={metrics.postingConsistencyScore || ''}
                  onChange={e => handleChange('postingConsistencyScore', e.target.value)}
                  placeholder="e.g. 75"
                  hint="How consistently you post on schedule (0 = never, 100 = perfect)"
                  error={errors.postingConsistencyScore}
                  isPrivate
                />
                <Input
                  label="Verified Audience Score (0–100)"
                  type="number"
                  min="0"
                  max="100"
                  value={metrics.verifiedAudienceScore || ''}
                  onChange={e => handleChange('verifiedAudienceScore', e.target.value)}
                  placeholder="e.g. 82"
                  hint="Percentage of audience verified as real (0 = all bots, 100 = all real)"
                  error={errors.verifiedAudienceScore}
                  isPrivate
                />

                {/* Live engagement preview (doesn't reveal inputs, just shows pass/fail) */}
                {metrics.followerCount > 0 && metrics.genuineEngagementCount > 0 && (
                  <div className={`p-4 rounded-xl border text-sm ${
                    meetsEngagement
                      ? 'bg-emerald-500/10 border-emerald-800/50 text-emerald-400'
                      : 'bg-red-500/10 border-red-800/50 text-red-400'
                  }`}>
                    <p className="font-medium">
                      {meetsEngagement ? '✓' : '✗'} Engagement rate{' '}
                      {meetsEngagement ? 'meets' : 'below'} threshold
                      {' '}({formatEngagementRate(liveEngagementBps)} vs required{' '}
                      {formatEngagementRate(env.thresholds.minEngagementBps)})
                    </p>
                    <p className="text-xs mt-1 opacity-70">
                      Note: your actual metric values will not be revealed on-chain
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Public thresholds */}
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white">Public Authenticity Thresholds</h2>
                  <Badge variant="info">On-Chain Config</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-gray-400">Min. Engagement</p>
                    <p className="text-white font-bold">{formatEngagementRate(env.thresholds.minEngagementBps)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Min. Consistency</p>
                    <p className="text-white font-bold">{env.thresholds.minConsistency}/100</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Min. Audience</p>
                    <p className="text-white font-bold">{env.thresholds.minAudienceScore}/100</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error message */}
            {isFailed && verificationState.error && (
              <div className="mt-4 p-4 rounded-xl bg-red-900/30 border border-red-800/50">
                <p className="text-red-400 text-sm font-medium">Circuit execution failed</p>
                <p className="text-red-300 text-xs mt-1">{verificationState.error}</p>
              </div>
            )}

            <div className="mt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isProcessing}
                disabled={walletState.status !== 'connected'}
              >
                {walletState.status !== 'connected'
                  ? 'Connect Wallet to Verify'
                  : isProcessing
                  ? 'Generating Proof…'
                  : 'Prove Authenticity'}
              </Button>
              {walletState.status !== 'connected' && (
                <p className="text-center text-xs text-gray-500 mt-2">
                  Connect your Lace wallet to submit the authenticity proof
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress steps */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-white">Proof Progress</h3>
              </CardHeader>
              <CardContent>
                <VerificationSteps currentStep={verificationState.step} />
              </CardContent>
            </Card>
          )}

          {/* Privacy flow diagram */}
          <Card>
            <CardContent>
              <PrivacyFlow />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
