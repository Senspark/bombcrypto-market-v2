import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { useChartData } from '../../hooks/analytics/useChartData';

const MainChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { data } = useChartData();

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff41',
      downColor: '#ff0033',
      borderVisible: false,
      wickUpColor: '#00ff41',
      wickDownColor: '#ff0033',
    });

    candleSeries.setData(data);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
};

export default MainChart;
