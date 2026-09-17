import { Card, CardContent, Badge } from '@/components/ui';
import { getEnvironment } from '@/utils/environment';

export function About() {
  const env = getEnvironment();
  const techStack = [
    { layer: 'Blockchain', tech: 'Midnight Network (Preview)' },
    { layer: 'Smart Contract Language', tech: 'Compact v0.23+' },
    { layer: 'ZK Runtime', tech: '@midnight-ntwrk/compact-runtime' },
    { layer: 'Wallet', tech: 'Lace Wallet / 1AM Wallet (Midnight edition)' },
    { layer: 'Frontend', tech: 'React 19 + TypeScript + Vite' },
    { layer: 'Styling', tech: 'Tailwind CSS' },
    { layer: 'Proof Server', tech: 'Midnight Docker proof server' },
    { layer: 'Deployment', tech: 'Vercel' },
    { layer: 'CI/CD', tech: 'GitHub Actions' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Badge variant="private" className="mb-4">Category: Consumer</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          About Creator Authenticity Ledger
        </h1>
      </div>

      <div className="space-y-8">
        {/* Product idea */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-white mb-3">Product Idea</h2>
            <p className="text-gray-300 leading-relaxed">
              Creator Authenticity Ledger is a privacy-preserving platform that proves
              creator legitimacy without exposing personal identity, follower counts,
              earnings, or other sensitive creator data. The influencer fraud ecosystem
              includes bot networks, engagement pods, purchased followers, and comment
              farms. Agencies currently rely heavily on screenshots of engagement metrics,
              which can be manipulated. Brands need a way to verify whether a creator is
              authentic without requiring the creator to expose private information.
              Using Midnight's privacy model, creators prove that their engagement metrics
              satisfy predefined authenticity requirements without revealing the underlying
              private values. Brands receive only the result necessary to determine
              whether the creator is authentic.
            </p>
          </CardContent>
        </Card>

        {/* Problem */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-white mb-3">The Problem</h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>🤖 Bot networks inflate follower counts, misleading brands</li>
              <li>📱 Engagement pods artificially boost interaction metrics</li>
              <li>📷 Screenshot-based verification is trivially manipulated</li>
              <li>🔓 Current verification requires sharing sensitive private data</li>
              <li>💸 Brands lose billions annually to influencer fraud</li>
            </ul>
          </CardContent>
        </Card>

        {/* Solution */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-white mb-3">Why Midnight</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Midnight is a data-protection blockchain specifically designed for applications
              where privacy is a core requirement — not an afterthought. Its Compact smart
              contract language compiles to ZK circuits, enabling computations over private
              data where only the proof (not the inputs) is recorded on-chain.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              This means creator metrics can be validated against authenticity rules
              without ever being transmitted to any server, stored in any database,
              or visible to any blockchain observer — including the brand receiving
              the verification result.
            </p>
          </CardContent>
        </Card>

        {/* Tech stack */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-white mb-3">Technology Stack</h2>
            <div className="space-y-2">
              {techStack.map(item => (
                <div key={item.layer} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                  <span className="text-sm text-gray-400">{item.layer}</span>
                  <span className="text-sm text-white font-medium">{item.tech}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contract */}
        <Card className="border-violet-800/40">
          <CardContent>
            <h2 className="text-lg font-semibold text-white mb-3">Deployed Contract</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <Badge variant="info">Midnight Preview</Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400 flex-shrink-0">Contract Address</span>
                <span className="font-mono text-xs text-gray-300 break-all text-right">
                  {env.contractAddress || 'Pending deployment'}
                </span>
              </div>
              {env.contractAddress && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400 flex-shrink-0">Deployed At</span>
                  <span className="text-xs text-gray-300">
                    {new Date('2026-09-15T19:30:52.392Z').toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
