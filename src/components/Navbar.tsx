import { Link, useLocation } from 'react-router-dom';
import { Button, Badge } from './ui';
import type { WalletState, WalletInfo } from '@/types';
import { formatAddress, getNetworkLabel } from '@/utils/environment';

interface NavbarProps {
  walletState: WalletState;
  onConnect: (walletId?: string) => void;
  onDisconnect: () => void;
  availableWallets: WalletInfo[];
}

export function Navbar({ walletState, onConnect, onDisconnect, availableWallets }: NavbarProps) {
  const location = useLocation();

  const navLinks = [
    { to: '/',        label: 'Home'     },
    { to: '/verify',  label: 'Verify'   },
    { to: '/brand',   label: 'Brands'   },
    { to: '/privacy', label: 'Privacy'  },
    { to: '/about',   label: 'About'    },
  ];

  const showWalletSelector = availableWallets.length > 1 && walletState.status !== 'connected';

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600
              flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/30
              group-hover:shadow-violet-500/50 transition-shadow">
              C
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-semibold text-sm leading-tight">Creator</div>
              <div className="text-violet-400 text-xs font-medium leading-tight">Authenticity Ledger</div>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-white bg-gray-800'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Wallet section */}
          <div className="flex items-center gap-3">
            {walletState.status === 'connected' ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="success" pulse>Connected</Badge>
                    {walletState.walletName && (
                      <span className="text-xs text-violet-400 font-medium">
                        {walletState.walletName}
                      </span>
                    )}
                    {walletState.network && (
                      <span className="text-xs text-gray-500">
                        {getNetworkLabel(walletState.network)}
                      </span>
                    )}
                  </div>
                  {walletState.address && (
                    <span className="text-xs text-gray-400 font-mono">
                      {formatAddress(walletState.address, 6)}
                    </span>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {showWalletSelector && (
                  <select
                    className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 focus:ring-violet-500 focus:border-violet-500"
                    onChange={e => onConnect(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select wallet</option>
                    {availableWallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  loading={walletState.status === 'connecting'}
                  onClick={() => onConnect()}
                >
                  {walletState.status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {walletState.error && (
        <div className="bg-red-900/30 border-b border-red-800/50 px-4 py-2 text-center">
          <p className="text-red-400 text-xs">{walletState.error}</p>
        </div>
      )}
    </nav>
  );
}
