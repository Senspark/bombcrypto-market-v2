import React from 'react';
import { useMarketStats } from '../../hooks/analytics/useMarketStats';

const MarketOverview: React.FC = () => {
  const { stats } = useMarketStats();

  if (!stats) return <div className="text-gray-500 p-4">Loading Market Data...</div>;

  return (
    <div className="grid grid-cols-2 gap-4 text-sm font-mono h-full">
      <div className="bg-[#111] p-4 border border-gray-800 flex flex-col justify-center">
        <div className="text-gray-400 uppercase text-xs tracking-wider mb-1">Floor (Heroes)</div>
        <div className="text-2xl text-white font-bold text-[#00ff41]">{stats.floorPriceHeroes} BCOIN</div>
      </div>
      <div className="bg-[#111] p-4 border border-gray-800 flex flex-col justify-center">
        <div className="text-gray-400 uppercase text-xs tracking-wider mb-1">Floor (Houses)</div>
        <div className="text-2xl text-white font-bold text-[#00ff41]">{stats.floorPriceHouses} BCOIN</div>
      </div>
      <div className="bg-[#111] p-4 border border-gray-800 flex flex-col justify-center">
        <div className="text-gray-400 uppercase text-xs tracking-wider mb-1">Volume (24h)</div>
        <div className="text-xl text-white font-mono">{stats.volume24h.toLocaleString()} BCOIN</div>
        <div className="text-xs text-gray-500 mt-1">${stats.volumeUsd.toLocaleString()} USD</div>
      </div>
      <div className="bg-[#111] p-4 border border-gray-800 flex flex-col justify-center">
        <div className="text-gray-400 uppercase text-xs tracking-wider mb-1">Listings</div>
        <div className="text-xl text-white font-mono">{stats.listings.toLocaleString()}</div>
        <div className="text-xs text-[#00ff41] mt-1">+{stats.percentChange24h}%</div>
      </div>
    </div>
  );
};

export default MarketOverview;
