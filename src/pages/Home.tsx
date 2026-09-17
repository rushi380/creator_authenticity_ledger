import { Link } from 'react-router-dom';
import { Button, Badge, Card, CardContent } from '@/components/ui';
import type { WalletState } from '@/types';
import { getEnvironment } from '@/utils/environment';

interface HomeProps {
  walletState: WalletState;
  onConnect: () => void;
}

export function Home({ walletState, onConnect }: HomeProps) {
  const env = getEnvironment();
  const features = [
    {
      icon: '🔒',
      title: 'Zero-Knowledge Privacy',
      description: 'Engagement metrics never leave your device. Only a cryptographic proof goes on-chain.',
    },
    {
      icon: '✅',
      title: 'On-Chain Verification',
      description: 'Brands receive a verifiable authenticity result recorded on Midnight Preview.',
    },
    {
      icon: '🌐',
      title: 'Decentralized Trust',
      description: 'No central authority. The Compact smart contract enforces the rules transparently.',
    },
    {
      icon: '🛡️',
      title: 'Fraud Prevention',
      description: 'Proven against bot networks, engagement pods, and purchased follower schemes.',
    },
  ];

  const contractAddress = env.contractAddress;

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-gray-950 to-indigo-950/20 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]
          bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <Badge variant="private" className="mb-6">
            🌙 Built on Midnight Network · Preview
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Creator Authenticity
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Ledger
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            Prove creator legitimacy without exposing private metrics.
            Zero-knowledge proofs on Midnight Network let creators verify
            authenticity — brands see the result, never the raw data.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {walletState.status === 'connected' ? (
              <Link to="/verify">
                <Button variant="primary" size="lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify Authenticity
                </Button>
              </Link>
            ) : (
              <Button variant="primary" size="lg" onClick={onConnect}
                loading={walletState.status === 'connecting'}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Connect Wallet
              </Button>
            )}
            <Link to="/brand">
              <Button variant="secondary" size="lg">
                Brand Verification
              </Button>
            </Link>
          </div>

          {/* Contract info */}
          {contractAddress && (
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full
              bg-gray-900/80 border border-gray-700 text-xs text-gray-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Preview: {contractAddress.slice(0, 12)}…{contractAddress.slice(-8)}
            </div>
          )}
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Privacy-First Influencer Verification
          </h2>
          <p className="text-gray-400">
            The influencer fraud ecosystem costs brands billions annually.
            Creator Authenticity Ledger solves it without violating creator privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <Card key={f.title} className="text-center" glow>
              <CardContent>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Privacy model callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Card glow className="overflow-hidden">
          <CardContent className="py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <Badge variant="error" className="mb-4">🚫 Observer Cannot Learn</Badge>
                <ul className="space-y-2.5 text-sm text-gray-300">
                  {[
                    'Exact follower count',
                    'Genuine engagement numbers',
                    'Posting consistency score',
                    'Verified audience percentage',
                    'Creator private identity',
                    'Earnings or revenue data',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-red-400">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Badge variant="success" className="mb-4">✓ Observer CAN Learn</Badge>
                <ul className="space-y-2.5 text-sm text-gray-300">
                  {[
                    'Contract address on Midnight',
                    'Authenticity result (true/false)',
                    'Public threshold configuration',
                    'Verification count (public counter)',
                    'Transaction metadata',
                    'Verification timestamp',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
