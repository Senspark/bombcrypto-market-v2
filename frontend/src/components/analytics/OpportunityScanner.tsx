import React from 'react';

const OpportunityScanner: React.FC = () => {
  const opportunities = [
    { id: 1, name: 'Hero #1234', price: 12.5, floorDiff: -15, roi: 120, rarity: 'Super Rare' },
    { id: 2, name: 'Hero #5678', price: 14.0, floorDiff: -10, roi: 110, rarity: 'Rare' },
    { id: 3, name: 'House #999', price: 220, floorDiff: -12, roi: 150, rarity: 'Tiny House' },
    { id: 4, name: 'Hero #4321', price: 11.0, floorDiff: -25, roi: 130, rarity: 'Rare' },
  ];

  return (
    <div className="bg-[#111] border border-gray-800 text-sm font-mono p-4 h-full">
      <div className="text-gray-400 mb-4 font-bold uppercase tracking-wider flex items-center">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
        Sniping Opportunities
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800 text-xs uppercase">
              <th className="pb-2 font-normal">Asset</th>
              <th className="pb-2 font-normal">Rarity</th>
              <th className="pb-2 text-right font-normal">Price</th>
              <th className="pb-2 text-right font-normal">vs Floor</th>
              <th className="pb-2 text-right font-normal">ROI (Est)</th>
              <th className="pb-2 text-right font-normal">Action</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp) => (
              <tr key={opp.id} className="border-b border-gray-800 hover:bg-gray-900 transition-colors group cursor-pointer">
                <td className="py-3 text-gray-300 font-bold group-hover:text-white">{opp.name}</td>
                <td className="py-3 text-purple-400 text-xs">{opp.rarity}</td>
                <td className="py-3 text-right text-white font-mono">{opp.price}</td>
                <td className="py-3 text-right text-[#00ff41] font-mono">{opp.floorDiff}%</td>
                <td className="py-3 text-right text-yellow-500 font-mono">{opp.roi}%</td>
                <td className="py-3 text-right">
                  <button className="bg-[#00ff41] text-black px-3 py-1 text-xs font-bold uppercase hover:bg-green-400 transition-colors shadow-[0_0_10px_rgba(0,255,65,0.3)] hover:shadow-[0_0_15px_rgba(0,255,65,0.6)]">
                    SNIPE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OpportunityScanner;
