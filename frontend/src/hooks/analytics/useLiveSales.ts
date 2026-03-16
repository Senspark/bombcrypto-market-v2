import { useState, useEffect } from 'react';

export interface Sale {
  id: string;
  itemName: string;
  price: number;
  currency: string;
  buyer: string;
  seller: string;
  timestamp: number;
  isWhale: boolean;
  type: 'Hero' | 'House';
  rarity?: string;
}

const RARITIES = ['Common', 'Rare', 'Super Rare', 'Epic', 'Legend', 'Super Legend'];

const generateSale = (): Sale => {
  const isHero = Math.random() > 0.2;
  const price = Math.random() * (isHero ? 100 : 5000) + 10;
  return {
    id: Math.random().toString(36).substr(2, 9),
    itemName: isHero ? `Hero #${Math.floor(Math.random() * 10000)}` : `House #${Math.floor(Math.random() * 5000)}`,
    price: parseFloat(price.toFixed(2)),
    currency: 'BCOIN',
    buyer: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
    seller: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
    timestamp: Date.now(),
    isWhale: price > 500,
    type: isHero ? 'Hero' : 'House',
    rarity: isHero ? RARITIES[Math.floor(Math.random() * RARITIES.length)] : undefined,
  };
};

export const useLiveSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    // Initial load
    const initialSales = Array.from({ length: 10 }, generateSale).sort((a, b) => b.timestamp - a.timestamp);
    setSales(initialSales);

    // Live update
    const interval = setInterval(() => {
      setSales(prev => [generateSale(), ...prev].slice(0, 50));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { sales };
};
