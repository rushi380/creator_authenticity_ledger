import { Card, CardContent } from './ui';

export function PrivacyFlow() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">How Zero-Knowledge Privacy Works</h3>

      <div className="relative">
        {/* Flow diagram */}
        <div className="flex flex-col items-center gap-2">
          {/* Private witness box */}
          <Card className="w-full border-violet-800/50 bg-violet-950/30">
            <CardContent className="py-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                  bg-violet-500/10 border border-violet-500/20 mb-3">
                  <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs font-semibold text-violet-400">PRIVATE WITNESS</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">Stays on your device</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Follower Count', 'Engagement Count', 'Consistency Score', 'Audience Score'].map(m => (
                    <div key={m} className="bg-gray-900/60 rounded-lg px-3 py-2 text-gray-300 font-mono">
                      ████████████
                      <div className="text-gray-500 text-xs mt-0.5">{m}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-4 bg-gradient-to-b from-violet-500/50 to-indigo-500/50" />
            <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 16l-6-6h12l-6 6z" />
            </svg>
          </div>

          {/* ZK Circuit box */}
          <Card className="w-full border-indigo-800/50 bg-indigo-950/30">
            <CardContent className="py-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                bg-indigo-500/10 border border-indigo-500/20 mb-2">
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
                <span className="text-xs font-semibold text-indigo-400">MIDNIGHT ZK CIRCUIT</span>
              </div>
              <p className="text-xs text-gray-400">Compact contract executes locally</p>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                engagement ≥ threshold AND consistency ≥ min AND audience ≥ min
              </p>
            </CardContent>
          </Card>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-4 bg-gradient-to-b from-indigo-500/50 to-cyan-500/50" />
            <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 16l-6-6h12l-6 6z" />
            </svg>
          </div>

          {/* Proof */}
          <Card className="w-full border-cyan-800/50 bg-cyan-950/20">
            <CardContent className="py-3 text-center">
              <span className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">
                🔐 Zero-Knowledge Proof
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Cryptographic proof that thresholds are satisfied
              </p>
            </CardContent>
          </Card>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-4 bg-gradient-to-b from-cyan-500/50 to-emerald-500/50" />
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 16l-6-6h12l-6 6z" />
            </svg>
          </div>

          {/* Public result */}
          <Card className="w-full border-emerald-800/50 bg-emerald-950/20">
            <CardContent className="py-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                bg-emerald-500/10 border border-emerald-500/20 mb-2">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-semibold text-emerald-400">PUBLIC VERIFICATION RESULT</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400 mt-1">✓ AUTHENTIC</p>
              <p className="text-xs text-gray-500 mt-1">
                Only this result is written on-chain. Private metrics stay hidden.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
