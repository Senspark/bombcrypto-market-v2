import React from 'react';
import TickerTape from '../../components/analytics/TickerTape';
import MainChart from '../../components/analytics/MainChart';
import MarketOverview from '../../components/analytics/MarketOverview';
import LiveSalesFeed from '../../components/analytics/LiveSalesFeed';
import OpportunityScanner from '../../components/analytics/OpportunityScanner';

const MarketAnalyticsDashboard: React.FC = () => {
  return (
    <div className="bg-[#050505] text-white font-sans flex flex-col min-h-[calc(100vh-80px)]">
      <TickerTape />

      <div className="flex-1 p-4 grid grid-cols-12 gap-4">
        {/* Left Panel: Market Overview (2 cols) */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          <div className="h-full">
            <MarketOverview />
          </div>
        </div>

        {/* Center Panel: Chart & Scanner (6 cols) */}
        <div className="col-span-12 xl:col-span-6 flex flex-col gap-4">
          <div className="bg-[#111] border border-gray-800 p-4 relative">
            <div className="text-gray-400 mb-2 font-bold flex justify-between items-center">
              <span className="text-lg text-white">BHERO/BCOIN</span>
              <div className="flex gap-2 text-xs font-mono">
                <span className="text-black bg-[#00ff41] px-2 py-0.5 rounded font-bold cursor-pointer hover:opacity-80 transition-opacity">15m</span>
                <span className="text-gray-400 cursor-pointer hover:text-white px-2 py-0.5 transition-colors">1h</span>
                <span className="text-gray-400 cursor-pointer hover:text-white px-2 py-0.5 transition-colors">4h</span>
                <span className="text-gray-400 cursor-pointer hover:text-white px-2 py-0.5 transition-colors">1d</span>
              </div>
            </div>
            {/* Chart Container */}
            <div className="w-full h-[400px]">
              <MainChart />
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <OpportunityScanner />
          </div>
        </div>

        {/* Right Panel: Live Sales (3 cols) */}
        <div className="col-span-12 xl:col-span-3 h-[800px] xl:h-auto">
          <LiveSalesFeed />
        </div>
      </div>
    </div>
  );
};

export default MarketAnalyticsDashboard;
