import { Card, CardContent, CardHeader, Badge } from '@/components/ui';
import { PrivacyFlow } from '@/components/PrivacyFlow';

export function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Privacy Model
        </h1>
        <p className="text-gray-400">
          How Creator Authenticity Ledger uses Midnight's zero-knowledge architecture
          to protect private data.
        </p>
      </div>

      {/* ZK flow */}
      <Card className="mb-8">
        <CardContent>
          <PrivacyFlow />
        </CardContent>
      </Card>

      {/* Public vs Private */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-emerald-800/40">
          <CardHeader>
            <Badge variant="success">What an Observer CAN Learn</Badge>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-gray-300">
              {[
                { icon: '✓', text: 'Contract address exists on Midnight Preview' },
                { icon: '✓', text: 'Binary authenticity result (true or false)' },
                { icon: '✓', text: 'Public threshold configuration values' },
                { icon: '✓', text: 'Total number of verifications performed' },
                { icon: '✓', text: 'Transaction hash and timestamp metadata' },
                { icon: '✓', text: 'Wallet address that submitted the proof' },
              ].map(item => (
                <li key={item.text} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-red-800/40">
          <CardHeader>
            <Badge variant="error">What an Observer CANNOT Learn</Badge>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-gray-300">
              {[
                { icon: '✕', text: 'Exact follower count' },
                { icon: '✕', text: 'Genuine engagement count or rate' },
                { icon: '✕', text: 'Posting consistency score' },
                { icon: '✕', text: 'Verified audience percentage' },
                { icon: '✕', text: 'Creator earnings or revenue' },
                { icon: '✕', text: 'Real-world identity information' },
                { icon: '✕', text: 'Private witness values of any kind' },
              ].map(item => (
                <li key={item.text} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Mathematical proof */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Authenticity Logic</h2>
          <p className="text-sm text-gray-400 mt-1">
            The Compact circuit enforces these conditions using integer arithmetic.
            No floating-point operations are used.
          </p>
        </CardHeader>
        <CardContent>
          <pre className="text-sm font-mono text-violet-300 bg-gray-900/80 rounded-xl p-4 overflow-x-auto">
{`// Integer basis-point arithmetic (avoids floating point)
// 300 bps = 3.00% minimum engagement rate

genuineEngagementCount × 10000 ≥ followerCount × minEngagementBps

AND

postingConsistencyScore ≥ minConsistency  (e.g., 60/100)

AND

verifiedAudienceScore ≥ minAudienceScore  (e.g., 70/100)

─────────────────────────────────────
All three conditions must be true.
Only the boolean result is disclosed.
Private values stay in the ZK witness.`}
          </pre>
        </CardContent>
      </Card>

      {/* Compact contract excerpt */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Compact Contract Excerpt</h2>
            <Badge variant="neutral">contracts/creator_authenticity.compact</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono text-green-400 bg-gray-900/80 rounded-xl p-4 overflow-x-auto">
{`pragma language_version 0.23;
import CompactStandardLibrary;

// ── PUBLIC on-chain state ────────────────────
export ledger isAuthentic: Boolean;
export ledger minEngagementBps: Uint<64>;

// ── PRIVATE witnesses (never touch the chain) ─
witness followerCount(): Uint<64>;
witness genuineEngagementCount(): Uint<64>;
witness postingConsistencyScore(): Uint<64>;
witness verifiedAudienceScore(): Uint<64>;

// ── Circuit: proves authenticity privately ───
export circuit proveAuthenticity(): [] {
  const followers   = followerCount();          // private
  const genuine     = genuineEngagementCount(); // private
  const consistency = postingConsistencyScore();// private
  const audience    = verifiedAudienceScore();  // private

  // Basis-point engagement check (no floats)
  assert(
    genuine * 10000 >= followers * minEngagementBps,
    "Engagement below threshold"
  );
  assert(consistency >= minConsistency, "Consistency below threshold");
  assert(audience   >= minAudienceScore, "Audience below threshold");

  // Only this boolean result is written on-chain
  isAuthentic = disclose(true);
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
