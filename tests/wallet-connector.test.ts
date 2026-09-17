import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  connectWalletByid,
  getAvailableWallets,
  isDappConnectorV4,
} from '@/utils/contract';

const originalWindow = globalThis.window;

function installWallets(wallets: Record<string, unknown>) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { midnight: wallets },
  });
}

const connector = {
  getUnshieldedAddress: vi.fn().mockResolvedValue({ unshieldedAddress: 'mn_addr_preview1test' }),
  getUnshieldedBalances: vi.fn().mockResolvedValue({}),
  getDustBalance: vi.fn().mockResolvedValue({ cap: 0n, balance: 0n }),
  getConfiguration: vi.fn().mockResolvedValue({ networkId: 'preview' }),
  submitTransaction: vi.fn(),
};

afterEach(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
  vi.clearAllMocks();
});

describe('Midnight DApp Connector v4 discovery', () => {
  it('does not treat an unrelated 1AM connect API as a DApp Connector', () => {
    const nonConnectorConnect = vi.fn();
    installWallets({
      '1am-internal': { name: '1AM internal', connect: nonConnectorConnect },
      '1am-v4': {
        name: '1AM Wallet',
        rdns: 'xyz.1am.wallet',
        apiVersion: '4.0.1',
        connect: vi.fn(),
      },
    });

    expect(getAvailableWallets()).toEqual([
      { id: '1am-v4', name: '1AM Wallet', icon: '', apiVersion: '4.0.1' },
    ]);
    expect(nonConnectorConnect).not.toHaveBeenCalled();
  });

  it('uses the v4 network-string signature for the selected 1AM connector', async () => {
    const connect = vi.fn().mockResolvedValue(connector);
    installWallets({
      '1am-v4': {
        name: '1AM Wallet',
        rdns: 'xyz.1am.wallet',
        apiVersion: '4.0.1',
        connect,
      },
    });

    const result = await connectWalletByid('1am-v4', 'preview');

    expect(connect).toHaveBeenCalledWith('preview');
    expect(result.walletState).toMatchObject({
      status: 'connected',
      walletId: '1am-v4',
      walletName: '1AM Wallet',
      network: 'preview',
    });
    expect(connector.getUnshieldedAddress).not.toHaveBeenCalled();
    expect(connector.getUnshieldedBalances).not.toHaveBeenCalled();
    expect(connector.getDustBalance).not.toHaveBeenCalled();
  });

  it('requires the declared v4 API version before invoking connect', () => {
    expect(isDappConnectorV4({ connect: vi.fn(), name: '1AM', rdns: 'xyz.1am.wallet', apiVersion: '3.9.0' })).toBe(false);
    expect(isDappConnectorV4({ connect: vi.fn(), name: '1AM', rdns: 'xyz.1am.wallet', apiVersion: '4.0.1' })).toBe(true);
  });
});
