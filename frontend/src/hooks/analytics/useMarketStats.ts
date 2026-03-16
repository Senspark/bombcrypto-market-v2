import { useState, useEffect } from 'react';

export interface MarketStats {
  floorPriceHeroes: number;
  floorPriceHouses: number;
  volume24h: number;
  listings: number;
  volumeUsd: number;
  volumeBnb: number;
  percentChange24h: number;
}

export const useMarketStats = () => {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setStats({
        floorPriceHeroes: 15.5,
        floorPriceHouses: 250,
        volume24h: 125000,
        listings: 4520,
        volumeUsd: 45000,
        volumeBnb: 125,
        percentChange24h: 5.2,
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return { stats, loading };
};
