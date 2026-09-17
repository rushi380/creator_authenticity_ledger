import { useState, useCallback, useEffect } from 'react';
import type { WalletState, MidnightWalletConnector, WalletInfo } from '@/types';
import { connectWalletByid, getAvailableWallets } from '@/utils/contract';
import { getEnvironment } from '@/utils/environment';

const INITIAL_STATE: WalletState = {
  status: 'disconnected',
  address: null,
  balance: null,
  network: null,
  error: null,
  walletId: null,
  walletName: null,
};

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_STATE);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [connector, setConnector] = useState<MidnightWalletConnector | null>(null);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      const wallets = getAvailableWallets();
      setAvailableWallets(wallets);
      attempts++;
      if (wallets.length > 0 || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 500);

    const handleFocus = () => {
      setAvailableWallets(getAvailableWallets());
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const connect = useCallback(async (preferredWalletId?: string) => {
    setWalletState(prev => ({ ...prev, status: 'connecting', error: null }));

    try {
      const env = getEnvironment();
      const available = getAvailableWallets();

      let targetId = preferredWalletId;
      if (!targetId) {
        if (available.some(w => w.id === '1am')) {
          targetId = '1am';
        } else if (available.some(w => w.id === 'mnLace' || w.id === 'lace')) {
          targetId = available.find(w => w.id === 'mnLace' || w.id === 'lace')!.id;
        } else if (available.length > 0) {
          targetId = available[0].id;
        }
      }

      if (!targetId) {
        throw new Error(
          'No Midnight wallet detected. Please install Lace or 1AM and refresh the page.'
        );
      }

      const { connector: newConnector, walletState: newState } = await connectWalletByid(
        targetId,
        env.network,
      );
      setConnector(newConnector);
      setWalletState(newState);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setWalletState(prev => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnector(null);
    setWalletState(INITIAL_STATE);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!connector) return;
    try {
      const unshieldedBalances = await connector.getUnshieldedBalances();
      const dustBalance = await connector.getDustBalance();
      const nativeBalance = unshieldedBalances['native'] ?? 0n;
      const balanceDisplay = nativeBalance > 0n ? nativeBalance.toString() : dustBalance.balance.toString();
      setWalletState(prev => ({ ...prev, balance: balanceDisplay || null }));
    } catch {
      // silently ignore balance refresh errors
    }
  }, [connector]);

  return {
    walletState,
    connector,
    connect,
    disconnect,
    refreshBalance,
    isConnected: walletState.status === 'connected',
    availableWallets,
  };
}
