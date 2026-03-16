import React from 'react';
import { useTokenPrices } from '../../hooks/analytics/useTokenPrices';

const TickerTape: React.FC = () => {
  const { prices } = useTokenPrices();
  const displayPrices = [...prices, ...prices, ...prices]; // Duplicate for seamless scrolling

  return (
    <div className="w-full bg-[#0a0a0a] border-b border-gray-800 overflow-hidden whitespace-nowrap box-border h-10 flex items-center">
      <div className="inline-block animate-marquee pl-4 whitespace-nowrap">
        {displayPrices.map((token, i) => (
          <span key={i} className="mx-8 font-mono text-sm">
            <span className="text-gray-400 font-bold">{token.symbol}:</span>
            <span className="text-white mx-2">${token.price.toFixed(4)}</span>
            <span className={token.change24h >= 0 ? 'text-[#00ff41]' : 'text-[#ff0033]'}>
              {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerTape;
