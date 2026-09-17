import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Verify } from './pages/Verify';
import { Brand } from './pages/Brand';
import { Privacy } from './pages/Privacy';
import { About } from './pages/About';
import { useWallet } from './hooks/useWallet';

function Footer() {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  return (
    <footer className="border-t border-gray-800/60 bg-gray-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Creator Authenticity Ledger</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Built on Midnight Network · Zero-Knowledge Privacy
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {contractAddress && (
              <p className="text-xs text-gray-500 font-mono">
                Preview: {contractAddress.slice(0, 16)}…
              </p>
            )}
            <p className="text-xs text-gray-600">
              © 2026 Creator Authenticity Ledger
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const { walletState, connect, disconnect, availableWallets } = useWallet();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Navbar
          walletState={walletState}
          onConnect={connect}
          onDisconnect={disconnect}
          availableWallets={availableWallets}
        />
        <div className="flex-1">
          <Routes>
            <Route
              path="/"
              element={<Home walletState={walletState} onConnect={connect} />}
            />
            <Route
              path="/verify"
              element={
                <Verify
                  walletState={walletState}
                  onConnect={connect}
                  onDisconnect={disconnect}
                />
              }
            />
            <Route path="/brand"   element={<Brand />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about"   element={<About />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
