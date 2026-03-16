import { useState, useEffect } from 'react';

export interface ChartDataPoint {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

export const useChartData = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate 30 days of data
    const generateData = () => {
      const result: ChartDataPoint[] = [];
      let currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - 30);
      let lastClose = 10;

      for (let i = 0; i < 30; i++) {
        const open = lastClose;
        const volatility = lastClose * 0.05;
        const change = (Math.random() - 0.5) * volatility;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        result.push({
          time: currentDate.toISOString().split('T')[0],
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
        });

        lastClose = close;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return result;
    };

    setTimeout(() => {
      setData(generateData());
      setLoading(false);
    }, 500);
  }, []);

  return { data, loading };
};
