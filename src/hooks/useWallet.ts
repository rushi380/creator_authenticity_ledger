import { useState, useCallback, useRef } from 'react';
import type { WalletState, MidnightWalletConnector } from '@/types';
import { connectLaceWallet } from '@/utils/contract';
import { getEnvironment } from '@/utils/environment';

const INITIAL_STATE: WalletState = {
  status: 'disconnected',
  address: null,
  balance: null,
  network: null,
  error: null,
};

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_STATE);
  const connectorRef = useRef<MidnightWalletConnector | null>(null);

  const connect = useCallback(async () => {
    setWalletState(prev => ({ ...prev, status: 'connecting', error: null }));

    try {
      const env = getEnvironment();
      const { connector, walletState: newState } = await connectLaceWallet(env.network);
      connectorRef.current = connector;
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
    connectorRef.current = null;
    setWalletState(INITIAL_STATE);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!connectorRef.current) return;
    try {
      const balance = await connectorRef.current.getBalance();
      setWalletState(prev => ({ ...prev, balance }));
    } catch {
      // silently ignore balance refresh errors
    }
  }, []);

  return {
    walletState,
    connector: connectorRef.current,
    connect,
    disconnect,
    refreshBalance,
    isConnected: walletState.status === 'connected',
  };
}
