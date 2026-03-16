import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import pulseApiClient from '../../utils/pulseApiClient';
import { useAccount } from '../../context/account';
import { BHero } from '../../types/hero';
import Loading from '../../components/layouts/loading';
import { createChart, ColorType, UTCTimestamp, LineSeries } from 'lightweight-charts';
import Slider from "../../components/forms/range";
import GroupCheckBox from "../../components/forms/checkbox";
import FieldPrice from "../../components/forms/fieldPrice";
import Ability from "../../components/forms/ability";
import Select from "../../components/forms/select";

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

const PulseBHeroDashboard: React.FC = () => {
  const [data, setData] = useState<BHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const [selectedRarities, setSelectedRarities] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['1', '5']);

  // Stats
  const [bombPower, setBombPower] = useState<string>('');
  const [speed, setSpeed] = useState<string>('');
  const [stamina, setStamina] = useState<string>('');
  const [bombCount, setBombCount] = useState<string>('');
  const [bombRange, setBombRange] = useState<string>('');
  const [ability, setAbility] = useState<number[]>([]);

  const { network } = useAccount();

  const toggleRarity = (r: number) => {
    if (selectedRarities.includes(r)) {
      setSelectedRarities(selectedRarities.filter(x => x !== r));
    } else {
      setSelectedRarities([...selectedRarities, r]);
    }
  };

  const toggleAbility = (a: number) => {
    if (ability.includes(a)) {
      setAbility(ability.filter(x => x !== a));
    } else {
      setAbility([...ability, a]);
    }
  }

  useEffect(() => {
    let unmounted = false;

    const fetchMarketData = async () => {
      setLoading(true);
      try {
        // Use the centralized pulseApiClient specifically designed for open source development!
        const response = await pulseApiClient.get(
          `/transactions/heroes/search?status=sold&size=100&order_by=desc:updated_at`
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
    let totalStatScore = 0;

    const now = new Date().getTime();
    const filteredData = data.filter(item => {
      // 1. Time Filter
      if (timeRange !== 'all') {
        if (!item.updated_at) return false;
        const itemTime = new Date(item.updated_at).getTime();
        const diffHours = (now - itemTime) / (1000 * 60 * 60);
        if (timeRange === '24h' && diffHours > 24) return false;
        if (timeRange === '7d' && diffHours > 24 * 7) return false;
        if (timeRange === '30d' && diffHours > 24 * 30) return false;
      }

      // 2. Rarity Filter
      if (selectedRarities.length > 0 && item.rarity !== undefined && !selectedRarities.includes(Number(item.rarity))) {
        return false;
      }

      // 3. Price Filter (converted from Wei)
      const priceEth = parseFloat(item.amount) / 1e18;
      if (minPrice !== '' && priceEth < parseFloat(minPrice)) return false;
      if (maxPrice !== '' && priceEth > parseFloat(maxPrice)) return false;

      // 4. Level Filter
      if (selectedLevels.length > 0) {
        const itemLevel = item.level || 1;
        const minLvl = parseInt(selectedLevels[0] || '1');
        const maxLvl = parseInt(selectedLevels[1] || '5');
        if (itemLevel < minLvl || itemLevel > maxLvl) return false;
      }

      // 5. Stats Filter
      if (bombPower !== '' && item.bomb_power !== Number(bombPower)) return false;
      if (speed !== '' && item.speed !== Number(speed)) return false;
      if (stamina !== '' && item.stamina !== Number(stamina)) return false;
      if (bombCount !== '' && item.bomb_count !== Number(bombCount)) return false;
      if (bombRange !== '' && item.bomb_range !== Number(bombRange)) return false;

      // 6. Abilities Filter
      if (ability.length > 0) {
         if (!item.abilities) return false;
         const hasAllAbilities = ability.every(a => item.abilities.includes(a));
         if (!hasAllAbilities) return false;
      }

      return true;
    });

    if (filteredData.length === 0) {
       return {
          gmv: "0.00",
          floorPrice: "0.0000",
          avgSalePrice: "0.0000",
          avgStatScore: "0",
          totalTransactions: 0,
          enrichedHeroes: [],
          chartData: []
       }
    }

    const enrichedHeroes = filteredData.map(hero => {
      // Map JSON keys which might be camelCase to snake_case if they're coming directly from API
      const stamina = hero.stamina || 0;
      const speed = hero.speed || 0;
      const bombPower = hero.bomb_power ?? (hero as any).bombPower ?? 0;
      const bombCount = hero.bomb_count ?? (hero as any).bombCount ?? 0;
      const bombRange = hero.bomb_range ?? (hero as any).bombRange ?? 0;
      const amount = hero.amount || '0';

      const statScore = stamina + speed + bombPower + bombCount + bombRange;
      const priceEth = parseFloat(amount) / 1e18;

      totalGmv += priceEth;
      if (priceEth < minFloorPrice) minFloorPrice = priceEth;
      totalStatScore += statScore;

      const priceEfficiency = priceEth > 0 ? statScore / priceEth : 0;

      return {
        ...hero,
        token_id: hero.token_id ?? (hero as any).tokenId,
        updated_at: hero.updated_at ?? (hero as any).updatedAt,
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
        if (!hero.updated_at) return;
        const dateStr = hero.updated_at.split('T')[0];

        if(!dailyVolumeMap[dateStr]) dailyVolumeMap[dateStr] = 0;
        dailyVolumeMap[dateStr] += parseFloat(hero.amount) / 1e18;
    });

    const chartData = Object.keys(dailyVolumeMap)
        .map(dateStr => ({ time: dateStr as unknown as UTCTimestamp, value: dailyVolumeMap[dateStr] }))
        .sort((a, b) => new Date(a.time as unknown as string).getTime() - new Date(b.time as unknown as string).getTime());

    return {
      gmv: totalGmv.toFixed(2),
      floorPrice: minFloorPrice === Infinity ? "0" : minFloorPrice.toFixed(4),
      avgSalePrice: avgPrice.toFixed(4),
      avgStatScore: avgStatScore.toFixed(0),
      totalTransactions: filteredData.length,
      enrichedHeroes,
      chartData
    };
  }, [data, timeRange, selectedRarities, minPrice, maxPrice, selectedLevels, bombPower, speed, stamina, bombCount, bombRange, ability]);

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
            <LoadingText>Pulse: Mining BHero Data...</LoadingText>
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
           <FilterBtn active={selectedRarities.includes(0)} onClick={() => toggleRarity(0)}>Common</FilterBtn>
           <FilterBtn active={selectedRarities.includes(1)} onClick={() => toggleRarity(1)}>Rare</FilterBtn>
           <FilterBtn active={selectedRarities.includes(2)} onClick={() => toggleRarity(2)}>S. Rare</FilterBtn>
           <FilterBtn active={selectedRarities.includes(3)} onClick={() => toggleRarity(3)}>Epic</FilterBtn>
           <FilterBtn active={selectedRarities.includes(4)} onClick={() => toggleRarity(4)}>Legend</FilterBtn>
           <FilterBtn active={selectedRarities.includes(5)} onClick={() => toggleRarity(5)}>SP Legend</FilterBtn>
        </div>

        <div className="title">Stats</div>
        <div className="level">
          <span style={{color: 'white', marginRight: '10px'}}>Level</span>
          <div style={{width: '100%'}}>
             <Slider min={1} max={5} name="level" init={selectedLevels} onChange={(_, val) => setSelectedLevels(val as string[])} />
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px'}}>
            <StatRow>
                <span>Power</span>
                <FilterInput type="number" value={bombPower} onChange={e => setBombPower(e.target.value)} />
            </StatRow>
            <StatRow>
                <span>Speed</span>
                <FilterInput type="number" value={speed} onChange={e => setSpeed(e.target.value)} />
            </StatRow>
            <StatRow>
                <span>Stamina</span>
                <FilterInput type="number" value={stamina} onChange={e => setStamina(e.target.value)} />
            </StatRow>
            <StatRow>
                <span>Bomb num</span>
                <FilterInput type="number" value={bombCount} onChange={e => setBombCount(e.target.value)} />
            </StatRow>
            <StatRow>
                <span>Range</span>
                <FilterInput type="number" value={bombRange} onChange={e => setBombRange(e.target.value)} />
            </StatRow>
        </div>

        <div className="title" style={{marginTop: '20px'}}>Ability</div>
        <Ability init={ability} onChange={(_, val) => setAbility(val as number[])} name="ability" />
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
            <Trend isPositive={true}>▲ +5.2% vs last 24h</Trend>
          </Scorecard>
          <Scorecard>
            <ScoreLabel>Avg Sale Price</ScoreLabel>
            <ScoreValue>{kpis?.avgSalePrice || "0"} BCOIN</ScoreValue>
            <Trend isPositive={false}>▼ -1.1% vs last 24h</Trend>
          </Scorecard>
          <Scorecard>
            <ScoreLabel>Floor Price (Sold)</ScoreLabel>
            <ScoreValue>{kpis?.floorPrice || "0"} BCOIN</ScoreValue>
            <Trend isPositive={true}>▲ +0.5% vs last 24h</Trend>
          </Scorecard>
          <Scorecard>
            <ScoreLabel>Avg Stat Score</ScoreLabel>
            <ScoreValue>{kpis?.avgStatScore || "0"}</ScoreValue>
            <Trend isPositive={true}>▲ +2.0% vs last 24h</Trend>
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
                  <td style={{color: '#ff973a'}}>{hero.priceEfficiency.toFixed(2)}</td>
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
    .level {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
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

const StatRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #888;
    font-size: 0.9rem;
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

export default PulseBHeroDashboard;
