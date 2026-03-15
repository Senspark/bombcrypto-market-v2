import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { getAPI } from '../../utils/helper';
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
    let minFloorPrice = Infinity;
    let totalStatScore = 0;

    const now = new Date().getTime();
    const filteredData = data.filter(item => {
      // 1. Time Filter
      if (timeRange !== 'all') {
        const itemTime = new Date(item.updated_at).getTime();
        const diffHours = (now - itemTime) / (1000 * 60 * 60);
        if (timeRange === '24h' && diffHours > 24) return false;
        if (timeRange === '7d' && diffHours > 24 * 7) return false;
        if (timeRange === '30d' && diffHours > 24 * 30) return false;
      }

      // 2. Rarity Filter
      if (selectedRarities.length > 0 && !selectedRarities.includes(Number(item.rarity))) {
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
          enrichedHeroes: [],
          chartData: []
       }
    }

    const enrichedHeroes = filteredData.map(hero => {
      const statScore = hero.stamina + hero.speed + hero.bomb_power + hero.bomb_count + hero.bomb_range;
      const priceEth = parseFloat(hero.amount) / 1e18;

      totalGmv += priceEth;
      if (priceEth < minFloorPrice) minFloorPrice = priceEth;
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
      floorPrice: minFloorPrice === Infinity ? "0" : minFloorPrice.toFixed(4),
      avgSalePrice: avgPrice.toFixed(4),
      avgStatScore: avgStatScore.toFixed(0),
      enrichedHeroes,
      chartData
    };
  }, [data, timeRange, selectedRarities, minPrice, maxPrice, selectedLevels, bombPower, speed, stamina, bombCount, bombRange, ability]);

  if (loading) {
    return (
      <LoadingWrapper>
        <Loading />
        <LoadingText>Pulse: Mining BHero Data...</LoadingText>
      </LoadingWrapper>
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
      </div>
    </ContentTab>
  );
};

const ContentTab = styled.div`
  width: 100%;
  border-top: none;
  display: flex;
  color: white;

  .left {
    flex: 0 0 23rem;
    width: 23rem;
    height: calc(100vh);
    border-right: 1px solid #3f445b;
    padding: 2rem 1.375rem;
    position: sticky;
    top: 0;
    overflow-y: auto;
    background: #050505;

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
    background: #050505;
  }
`;

const FilterBtn = styled.button<{active: boolean}>`
  background: ${props => props.active ? '#00ff41' : 'transparent'};
  color: ${props => props.active ? '#000' : '#888'};
  border: 1px solid ${props => props.active ? '#00ff41' : '#333'};
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${props => props.active ? '#000' : '#fff'};
    background: ${props => props.active ? '#00ff41' : '#222'};
  }
`;

const FilterInput = styled.input`
  background: #222;
  border: 1px solid #444;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  width: 60px;
  font-family: monospace;
  outline: none;
  &:focus {
    border-color: #00ff41;
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
  font-family: "agency-fb-regular", sans-serif;
`;

const ScoreValue = styled.div`
  color: #00ff41;
  font-size: 2.5rem;
  font-weight: bold;
  font-family: "agency-fb-regular", sans-serif;
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
  background: #050505;
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
  width: 100%;
`;

export default PulseBHeroDashboard;
