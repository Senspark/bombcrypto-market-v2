import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { getAPI } from '../../utils/helper';
import { useAccount } from '../../context/account';
import { BHero } from '../../types/hero';
import Loading from '../../components/layouts/loading';
import { ContainerFull } from '../../components/common/style';
import { createChart, ColorType, UTCTimestamp, Time, LineSeries } from 'lightweight-charts';

// Helper for formatting ETH values
const formatEth = (wei: string) => (parseFloat(wei) / 1e18).toFixed(4);

// Chart Component wrapper
const SalesChart: React.FC<{ data: { time: UTCTimestamp; value: number }[] }> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#111' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: '#333' },
          horzLines: { color: '#333' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
      });

      const lineSeries = chart.addSeries(
          LineSeries,
          {
            color: '#00ff41',
            lineWidth: 2,
          }
      );

      lineSeries.setData(data);

      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, [data]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '300px' }} />;
};


// Pulse Dashboard: Strategic Data View
const PulseDashboard: React.FC = () => {
  const [data, setData] = useState<BHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');

  const { network } = useAccount();

  useEffect(() => {
    let unmounted = false;

    const fetchMarketData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${getAPI(network)}transactions/heroes/search?status=sold&size=100&order_by=desc:updated_at`
        );

        if (!unmounted && response.data && response.data.transactions) {
          setData(response.data.transactions);
        }
      } catch (err: any) {
        if (!unmounted) {
          console.error("Pulse: Error fetching market data", err);
          setError("Failed to load strategic data.");
        }
      } finally {
        if (!unmounted) setLoading(false);
      }
    };

    fetchMarketData();

    return () => {
      unmounted = true;
    };
  }, [network]);

  const kpis = useMemo(() => {
    if (!data || data.length === 0) return null;

    let totalGmv = 0;
    let minPrice = Infinity;
    let totalStatScore = 0;

    // Filter data based on timeRange
    const now = new Date().getTime();
    const filteredData = data.filter(item => {
      if (timeRange === 'all') return true;
      const itemTime = new Date(item.updated_at).getTime();
      const diffHours = (now - itemTime) / (1000 * 60 * 60);

      if (timeRange === '24h') return diffHours <= 24;
      if (timeRange === '7d') return diffHours <= 24 * 7;
      if (timeRange === '30d') return diffHours <= 24 * 30;
      return true;
    });

    if (filteredData.length === 0) {
       return {
          gmv: "0.00",
          floorPrice: "0.0000",
          avgSalePrice: "0.0000",
          avgStatScore: "0",
          enrichedHeroes: [],
          chartData: []
       }
    }

    const enrichedHeroes = filteredData.map(hero => {
      const statScore = hero.stamina + hero.speed + hero.bomb_power + hero.bomb_count + hero.bomb_range;
      const priceEth = parseFloat(hero.amount) / 1e18;

      totalGmv += priceEth;
      if (priceEth < minPrice) minPrice = priceEth;
      totalStatScore += statScore;

      const priceEfficiency = priceEth > 0 ? statScore / priceEth : 0;

      return {
        ...hero,
        statScore,
        priceEth,
        priceEfficiency
      };
    });

    const avgPrice = totalGmv / filteredData.length;
    const avgStatScore = totalStatScore / filteredData.length;

    // Aggregate for Daily Volume Chart
    const dailyVolumeMap: Record<string, number> = {};
    filteredData.forEach(hero => {
        // Group by day using updated_at
        const dateStr = hero.updated_at.split('T')[0];
        const ts = new Date(dateStr).getTime() / 1000;

        if(!dailyVolumeMap[ts]) dailyVolumeMap[ts] = 0;
        dailyVolumeMap[ts] += parseFloat(hero.amount) / 1e18;
    });

    const chartData = Object.keys(dailyVolumeMap)
        .map(ts => ({ time: parseInt(ts) as UTCTimestamp, value: dailyVolumeMap[ts] }))
        .sort((a, b) => (a.time as number) - (b.time as number));

    return {
      gmv: totalGmv.toFixed(2),
      floorPrice: minPrice === Infinity ? "0" : minPrice.toFixed(4),
      avgSalePrice: avgPrice.toFixed(4),
      avgStatScore: avgStatScore.toFixed(0),
      enrichedHeroes,
      chartData
    };
  }, [data, timeRange]);

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingWrapper>
          <Loading />
          <LoadingText>Pulse: Mining Market Data...</LoadingText>
        </LoadingWrapper>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <ErrorText>{error}</ErrorText>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <ContainerFull>
        <Header>
          <Title>📈 Pulse: Strategic Dashboard</Title>
          <FilterBar>
             <FilterBtn active={timeRange === '24h'} onClick={() => setTimeRange('24h')}>24H</FilterBtn>
             <FilterBtn active={timeRange === '7d'} onClick={() => setTimeRange('7d')}>7D</FilterBtn>
             <FilterBtn active={timeRange === '30d'} onClick={() => setTimeRange('30d')}>30D</FilterBtn>
             <FilterBtn active={timeRange === 'all'} onClick={() => setTimeRange('all')}>ALL</FilterBtn>
          </FilterBar>
        </Header>
        <Content>
          <ScorecardGrid>
            <Scorecard>
              <ScoreLabel>GMV (Volume)</ScoreLabel>
              <ScoreValue>{kpis?.gmv || "0"} BCOIN</ScoreValue>
            </Scorecard>
            <Scorecard>
              <ScoreLabel>Avg Sale Price</ScoreLabel>
              <ScoreValue>{kpis?.avgSalePrice || "0"} BCOIN</ScoreValue>
            </Scorecard>
            <Scorecard>
              <ScoreLabel>Floor Price (Sold)</ScoreLabel>
              <ScoreValue>{kpis?.floorPrice || "0"} BCOIN</ScoreValue>
            </Scorecard>
            <Scorecard>
              <ScoreLabel>Avg Stat Score</ScoreLabel>
              <ScoreValue>{kpis?.avgStatScore || "0"}</ScoreValue>
            </Scorecard>
          </ScorecardGrid>

          <ChartSection>
            <SectionTitle>Daily Sales Volume (BCOIN)</SectionTitle>
            {kpis?.chartData && kpis.chartData.length > 0 ? (
               <SalesChart data={kpis.chartData} />
            ) : (
                <div style={{color: '#888', padding: '2rem', textAlign: 'center'}}>Not enough data points to map history.</div>
            )}
          </ChartSection>

          <ChartSection>
            <SectionTitle>Opportunity Scanner (Top Price Efficiency)</SectionTitle>
            <Table>
              <thead>
                <tr>
                  <th>Token ID</th>
                  <th>Rarity</th>
                  <th>Price (BCOIN)</th>
                  <th>Stat Score</th>
                  <th>Efficiency (Stats/BCOIN)</th>
                </tr>
              </thead>
              <tbody>
                {kpis?.enrichedHeroes
                  .sort((a, b) => b.priceEfficiency - a.priceEfficiency)
                  .slice(0, 5)
                  .map(hero => (
                  <tr key={hero.id}>
                    <td>#{hero.token_id}</td>
                    <td>Tier {hero.rarity}</td>
                    <td>{hero.priceEth.toFixed(4)}</td>
                    <td>{hero.statScore}</td>
                    <td style={{color: '#00ff41'}}>{hero.priceEfficiency.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ChartSection>
        </Content>
      </ContainerFull>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  width: 100%;
  min-height: calc(100vh - 80px);
  background-color: #050505;
  padding: 2rem 0;
  color: white;
  font-family: 'agency-fb-regular', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #3f445b;
  padding-bottom: 1rem;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  background: #111;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #333;
`;

const FilterBtn = styled.button<{active: boolean}>`
  background: ${props => props.active ? '#00ff41' : 'transparent'};
  color: ${props => props.active ? '#000' : '#888'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${props => props.active ? '#000' : '#fff'};
    background: ${props => props.active ? '#00ff41' : '#222'};
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #fff;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ScorecardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
`;

const Scorecard = styled.div`
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
`;

const ScoreLabel = styled.div`
  color: #888;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

const ScoreValue = styled.div`
  color: #00ff41;
  font-size: 2.5rem;
  font-weight: bold;
`;

const ChartSection = styled.div`
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  color: #fff;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #222;
  padding-bottom: 0.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #222;
  }

  th {
    color: #888;
    font-weight: normal;
    text-transform: uppercase;
    font-size: 0.9rem;
  }

  tr:hover {
    background: #1a1a1a;
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
`;

const LoadingText = styled.div`
  margin-top: 1rem;
  font-size: 1.5rem;
  color: #00ff41;
  font-family: monospace;
`;

const ErrorText = styled.div`
  color: #ff3333;
  font-size: 1.5rem;
  text-align: center;
  margin-top: 5rem;
`;

export default PulseDashboard;
