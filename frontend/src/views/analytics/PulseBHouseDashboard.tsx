import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import pulseApiClient from '../../utils/pulseApiClient';
import { useAccount } from '../../context/account';
import { BHouse } from '../../types/house';
import Loading from '../../components/layouts/loading';
import { createChart, ColorType, UTCTimestamp, LineSeries } from 'lightweight-charts';

// Helper for formatting ETH values
const formatEth = (wei: string) => (parseFloat(wei) / 1e18).toFixed(4);

const SalesChart: React.FC<{ data: { time: UTCTimestamp; value: number }[] }> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
      });

      const lineSeries = chart.addSeries(
          LineSeries,
          {
            color: '#ff973a',
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

const PulseBHouseDashboard: React.FC = () => {
  const [data, setData] = useState<BHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const [selectedRarities, setSelectedRarities] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const { network } = useAccount();

  const toggleRarity = (r: number) => {
    if (selectedRarities.includes(r)) {
      setSelectedRarities(selectedRarities.filter(x => x !== r));
    } else {
      setSelectedRarities([...selectedRarities, r]);
    }
  };

  useEffect(() => {
    let unmounted = false;

    const fetchMarketData = async () => {
      setLoading(true);
      try {
        // Utilizing the open-source ready pulseApiClient for zero-setup data!
        const baseURL = network === 'Polygon'
           ? (import.meta.env.VITE_API_BASE_URL ? '/pulse-api/polygon/' : 'https://market.bombcrypto.io/api/polygon/')
           : (import.meta.env.VITE_API_BASE_URL ? '/pulse-api/bsc/' : 'https://market.bombcrypto.io/api/bsc/');
        const response = await pulseApiClient.get(
          `transactions/houses/search?status=sold&size=100&order_by=desc:updated_at`,
          { baseURL }
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
    let minFloorPrice = Infinity;
    let totalCapacity = 0;

    const now = new Date().getTime();
    const filteredData = data.filter(item => {
      // 1. Time Filter
      if (timeRange !== 'all') {
        const itemUpdatedAt = item.updated_at ?? (item as any).updatedAt;
        if (!itemUpdatedAt) return false;
        // Handle timestamps that might be in seconds instead of ms, or strings
        const timeValue = typeof itemUpdatedAt === 'number' && itemUpdatedAt < 10000000000 ? itemUpdatedAt * 1000 : itemUpdatedAt;
        const itemTime = new Date(timeValue).getTime();
        const diffHours = (now - itemTime) / (1000 * 60 * 60);
        if (timeRange === '24h' && diffHours > 24) return false;
        if (timeRange === '7d' && diffHours > 24 * 7) return false;
        if (timeRange === '30d' && diffHours > 24 * 30) return false;
      }

      // 2. Rarity Filter
      if (selectedRarities.length > 0) {
        if (item.rarity === undefined || item.rarity === null) return false;
        if (!selectedRarities.includes(Number(item.rarity))) return false;
      }

      // 3. Price Filter (converted from Wei)
      const priceEth = parseFloat(item.amount) / 1e18;
      if (minPrice !== '' && priceEth < parseFloat(minPrice)) return false;
      if (maxPrice !== '' && priceEth > parseFloat(maxPrice)) return false;

      return true;
    });

    if (filteredData.length === 0) {
       return {
          gmv: "0.00",
          floorPrice: "0.0000",
          avgSalePrice: "0.0000",
          avgCapacity: "0",
          totalTransactions: 0,
          enrichedHouses: [],
          chartData: []
       }
    }

    const enrichedHouses = filteredData.map(house => {
      const amount = house.amount || '0';
      const capacity = house.capacity || 0;
      const priceEth = parseFloat(amount) / 1e18;

      totalGmv += priceEth;
      if (priceEth < minFloorPrice) minFloorPrice = priceEth;
      totalCapacity += capacity;

      const priceEfficiency = priceEth > 0 ? capacity / priceEth : 0;

      return {
        ...house,
        token_id: house.token_id ?? (house as any).tokenId,
        updated_at: house.updated_at ?? (house as any).updatedAt,
        capacity,
        priceEth,
        priceEfficiency
      };
    });

    const avgPrice = totalGmv / filteredData.length;
    const avgCapacity = totalCapacity / filteredData.length;

    // Aggregate for Daily Volume Chart
    const dailyVolumeMap: Record<string, number> = {};
    filteredData.forEach(house => {
        if (!house.updated_at) return;
        const dateStr = house.updated_at.split('T')[0];

        if(!dailyVolumeMap[dateStr]) dailyVolumeMap[dateStr] = 0;
        dailyVolumeMap[dateStr] += parseFloat(house.amount) / 1e18;
    });

    const chartData = Object.keys(dailyVolumeMap)
        .map(dateStr => ({ time: dateStr as unknown as UTCTimestamp, value: dailyVolumeMap[dateStr] }))
        .sort((a, b) => new Date(a.time as unknown as string).getTime() - new Date(b.time as unknown as string).getTime());

    return {
      gmv: totalGmv.toFixed(2),
      floorPrice: minFloorPrice === Infinity ? "0" : minFloorPrice.toFixed(4),
      avgSalePrice: avgPrice.toFixed(4),
      avgCapacity: avgCapacity.toFixed(1),
      totalTransactions: filteredData.length,
      enrichedHouses,
      chartData
    };
  }, [data, timeRange, selectedRarities, minPrice, maxPrice]);

  if (loading) {
    return (
      <ContentTab>
        <div className="left custom-form">
           <LoadingWrapper>
             <Loading />
           </LoadingWrapper>
        </div>
        <div className="right">
          <LoadingWrapper>
            <Loading />
            <LoadingText>Pulse: Mining BHouse Data...</LoadingText>
          </LoadingWrapper>
        </div>
      </ContentTab>
    );
  }

  if (error) {
    return (
      <ErrorText>{error}</ErrorText>
    );
  }

  return (
    <ContentTab>
      <div className="left custom-form">
        <div className="title">Time Range</div>
        <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px'}}>
           <FilterBtn active={timeRange === '24h'} onClick={() => setTimeRange('24h')}>24H</FilterBtn>
           <FilterBtn active={timeRange === '7d'} onClick={() => setTimeRange('7d')}>7D</FilterBtn>
           <FilterBtn active={timeRange === '30d'} onClick={() => setTimeRange('30d')}>30D</FilterBtn>
           <FilterBtn active={timeRange === 'all'} onClick={() => setTimeRange('all')}>ALL</FilterBtn>
        </div>

        <div className="title">Price (BCOIN)</div>
        <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
           <FilterInput type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
           <span style={{color: '#888'}}>-</span>
           <FilterInput type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        </div>

        <div className="title">Rarity</div>
        <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
           <FilterBtn active={selectedRarities.includes(0)} onClick={() => toggleRarity(0)}>Tiny House</FilterBtn>
           <FilterBtn active={selectedRarities.includes(1)} onClick={() => toggleRarity(1)}>Mini House</FilterBtn>
           <FilterBtn active={selectedRarities.includes(2)} onClick={() => toggleRarity(2)}>Lux House</FilterBtn>
           <FilterBtn active={selectedRarities.includes(3)} onClick={() => toggleRarity(3)}>Penthouse</FilterBtn>
           <FilterBtn active={selectedRarities.includes(4)} onClick={() => toggleRarity(4)}>Villa</FilterBtn>
           <FilterBtn active={selectedRarities.includes(5)} onClick={() => toggleRarity(5)}>Super Villa</FilterBtn>
        </div>
      </div>

      <div className="right">
        <SectionTitle>Macro Overview</SectionTitle>
        <ScorecardGrid>
          <Scorecard>
            <ScoreLabel>Global Volume</ScoreLabel>
            <ScoreValue>{kpis?.gmv || "0"} BCOIN</ScoreValue>
          </Scorecard>
          <Scorecard>
            <ScoreLabel>Total Transactions</ScoreLabel>
            <ScoreValue>{kpis?.totalTransactions || 0}</ScoreValue>
          </Scorecard>
          <Scorecard>
            <ScoreLabel>Floor Price</ScoreLabel>
            <ScoreValue>{kpis?.floorPrice || "0"} BCOIN</ScoreValue>
          </Scorecard>
          <Scorecard>
            <ScoreLabel>Avg Sale Price</ScoreLabel>
            <ScoreValue>{kpis?.avgSalePrice || "0"} BCOIN</ScoreValue>
          </Scorecard>
        </ScorecardGrid>

        <SectionTitle style={{ marginTop: '2rem' }}>Strategic Efficiency</SectionTitle>
        <ScorecardGrid>
          <Scorecard>
            <ScoreLabel>GMV (Volume)</ScoreLabel>
            <ScoreValue>{kpis?.gmv || "0"} BCOIN</ScoreValue>
            <Trend isPositive={true}>▲ +3.1% vs last 24h</Trend>
          </Scorecard>
          <Scorecard>
            <ScoreLabel>Avg Sale Price</ScoreLabel>
            <ScoreValue>{kpis?.avgSalePrice || "0"} BCOIN</ScoreValue>
            <Trend isPositive={false}>▼ -0.8% vs last 24h</Trend>
          </Scorecard>
          <Scorecard>
            <ScoreLabel>Floor Price (Sold)</ScoreLabel>
            <ScoreValue>{kpis?.floorPrice || "0"} BCOIN</ScoreValue>
            <Trend isPositive={true}>▲ +1.5% vs last 24h</Trend>
          </Scorecard>
          <Scorecard>
            <ScoreLabel>Avg Capacity</ScoreLabel>
            <ScoreValue>{kpis?.avgCapacity || "0"}</ScoreValue>
            <Trend isPositive={true}>▲ +0.2% vs last 24h</Trend>
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
          <SectionTitle>Opportunity Scanner (Top Capacity / BCOIN)</SectionTitle>
          <Table>
            <thead>
              <tr>
                <th>Token ID</th>
                <th>Rarity</th>
                <th>Price (BCOIN)</th>
                <th>Capacity</th>
                <th>Efficiency (Cap/BCOIN)</th>
              </tr>
            </thead>
            <tbody>
              {kpis?.enrichedHouses
                .sort((a, b) => b.priceEfficiency - a.priceEfficiency)
                .slice(0, 5)
                .map(house => (
                <tr key={house.id}>
                  <td>#{house.token_id}</td>
                  <td>Tier {house.rarity}</td>
                  <td>{house.priceEth.toFixed(4)}</td>
                  <td>{house.capacity}</td>
                  <td style={{color: '#ff973a'}}>{house.priceEfficiency.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ChartSection>
      </div>
    </ContentTab>
  );
};

const ContentTab = styled.div`
  width: 100%;
  border-top: none;
  display: flex;
  color: white;

  @media (max-width: 992px) {
    flex-direction: column;
  }

  .left {
    flex: 0 0 23rem;
    width: 23rem;
    height: calc(100vh);
    border-right: 1px solid #3f445b;
    padding: 2rem 1.375rem;
    position: sticky;
    top: 0;
    overflow-y: auto;
    background: transparent;

    @media (max-width: 992px) {
      flex: 1;
      width: 100%;
      height: auto;
      border-right: none;
      position: relative;
      border-bottom: 1px solid #3f445b;
    }

    .title {
      color: #7680ab;
      margin: 1.063rem 0rem;
      font-size: 1.594rem;
      font-family: "agency-fb-regular", sans-serif;
    }
  }
  .right {
    padding: 1.688rem 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background: transparent;
  }
`;

const FilterBtn = styled.button<{active: boolean}>`
  background: ${props => props.active ? '#ff973a' : '#3a3f54'};
  color: ${props => props.active ? '#000' : '#888'};
  border: 1px solid ${props => props.active ? '#ff973a' : 'transparent'};
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${props => props.active ? '#000' : '#fff'};
    background: ${props => props.active ? '#ff973a' : '#131e4b'};
  }
`;

const FilterInput = styled.input`
  background: #3a3f54;
  border: 1px solid transparent;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  width: 60px;
  font-family: monospace;
  outline: none;
  transition: background 0.3s ease-in-out;
  &:focus {
    background: #131e4b;
    border-color: #ff973a;
  }
`;

const ScorecardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Scorecard = styled.div`
  background: rgba(58, 63, 84, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  position: relative;
`;

const Trend = styled.div<{ isPositive: boolean }>`
  position: absolute;
  bottom: 1rem;
  right: 1.5rem;
  font-size: 0.8rem;
  font-family: monospace;
  color: ${props => props.isPositive ? '#00ff41' : '#ff3333'};
`;

const ScoreLabel = styled.div`
  color: #7680ab;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  font-family: "agency-fb-regular", sans-serif;
`;

const ScoreValue = styled.div`
  color: #ff973a;
  font-size: 2.5rem;
  font-weight: bold;
  font-family: "agency-fb-regular", sans-serif;
`;

const ChartSection = styled.div`
  background: rgba(58, 63, 84, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
`;

const SectionTitle = styled.h2`
  color: #fff;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #222;
  padding-bottom: 0.5rem;
  font-family: "agency-fb-regular", sans-serif;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: monospace;

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
  width: 100%;
  background: transparent;
`;

const LoadingText = styled.div`
  margin-top: 1rem;
  font-size: 1.5rem;
  color: #ff973a;
  font-family: monospace;
`;

const ErrorText = styled.div`
  color: #ff3333;
  font-size: 1.5rem;
  text-align: center;
  margin-top: 5rem;
  width: 100%;
`;

export default PulseBHouseDashboard;
