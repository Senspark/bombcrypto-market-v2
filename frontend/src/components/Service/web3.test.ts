import { describe, it, expect } from 'vitest';
import { getProvider } from './web3';
import { FallbackProvider, JsonRpcProvider } from 'ethers';

describe('getProvider', () => {
  it('Scenario A (Polygon - 137): Returns FallbackProvider when given multiple RPC URLs', () => {
    const polygonUrls = [
      'https://polygon-rpc.com',
      'https://rpc-mainnet.maticvigil.com',
      'https://rpc-mainnet.matic.network'
    ];

    const provider = getProvider(polygonUrls);

    expect(provider).toBeInstanceOf(FallbackProvider);
    // @ts-ignore
    expect(provider.providerConfigs.length).toBe(3);
  });

  it('Scenario B (BSC - 56): Returns JsonRpcProvider when given a single RPC URL', () => {
    const bscUrl = ['https://bsc-dataseed.binance.org'];

    const provider = getProvider(bscUrl);

    expect(provider).toBeInstanceOf(JsonRpcProvider);
  });
});
