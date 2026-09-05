import { Card, CardContent, Button, Badge } from './ui';
import type { WalletState } from '@/types';
import { formatAddress, getNetworkLabel } from '@/utils/environment';

interface WalletStatusProps {
  walletState: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletStatus({ walletState, onConnect, onDisconnect }: WalletStatusProps) {
  if (walletState.status === 'connected') {
    return (
      <Card className="border-emerald-800/40">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20
                flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Lace Wallet</span>
                  <Badge variant="success" pulse>Connected</Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {walletState.address && (
                    <span className="text-xs text-gray-400 font-mono">
                      {formatAddress(walletState.address, 8)}
                    </span>
                  )}
                  {walletState.network && (
                    <span className="text-xs text-gray-500">
                      {getNetworkLabel(walletState.network)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={onDisconnect}>
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={walletState.status === 'error' ? 'border-red-800/40' : ''}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700
              flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Lace Wallet</span>
                <Badge variant={walletState.status === 'error' ? 'error' : 'neutral'}>
                  {walletState.status === 'error' ? 'Error' : 'Not Connected'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {walletState.error ?? 'Connect your Lace wallet to proceed'}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={walletState.status === 'connecting'}
            onClick={onConnect}
          >
            {walletState.status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
