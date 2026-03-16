import { useState, useEffect } from 'react';

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
}

export const useTokenPrices = () => {
  const [prices, setPrices] = useState<TokenPrice[]>([
    { symbol: 'BNB', price: 320.50, change24h: 1.2 },
    { symbol: 'MATIC', price: 0.85, change24h: -0.5 },
    { symbol: 'BCOIN', price: 0.05, change24h: 2.3 },
    { symbol: 'SEN', price: 0.012, change24h: 0.1 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(token => ({
        ...token,
        price: token.price * (1 + (Math.random() - 0.5) * 0.002), // Small fluctuation
        change24h: token.change24h + (Math.random() - 0.5) * 0.1,
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { prices };
};
