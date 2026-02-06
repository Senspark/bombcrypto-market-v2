import React, { useMemo } from 'react';
import styled from 'styled-components';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { bcoinFormat, mapRarity } from '../../utils/helper';
import _ from 'lodash';

interface PulseDashboardProps {
  data: any[];
  totalCount: number | undefined;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const PulseDashboard: React.FC<PulseDashboardProps> = ({ data, totalCount }) => {

  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    let totalVolume = 0;
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    const prices: number[] = [];
    const rarityMap: Record<string, number> = {};
    const salesOverTime: any[] = []; // Assuming we can use block_timestamp if available

    data.forEach((item) => {
      const price = bcoinFormat(item.amount);
      if (price) {
        totalVolume += price;
        prices.push(price);
        if (price < minPrice) minPrice = price;
        if (price > maxPrice) maxPrice = price;
      }

      // Rarity
      const rarityLabel = mapRarity(item.rarity) || 'Unknown';
      rarityMap[rarityLabel] = (rarityMap[rarityLabel] || 0) + 1;

      // Time (mocking sequence for now since we sort by latest usually)
      if (item.block_timestamp) {
         // rudimentary time parsing if string
      }
    });

    const avgPrice = totalVolume / (data.length || 1);

    // Prepare Rarity Data
    const rarityChartData = Object.keys(rarityMap).map((key) => ({
      name: key,
      value: rarityMap[key],
    }));

    // Prepare Price Distribution (Buckets)
    // Simple 5 buckets
    const bucketSize = (maxPrice - minPrice) / 5 || 1;
    const priceBuckets: Record<string, number> = {};
    prices.forEach(p => {
        const bucketIndex = Math.floor((p - minPrice) / bucketSize);
        const rangeStart = Math.floor(minPrice + (bucketIndex * bucketSize));
        const rangeEnd = Math.floor(minPrice + ((bucketIndex + 1) * bucketSize));
        const label = `${rangeStart}-${rangeEnd}`;
        priceBuckets[label] = (priceBuckets[label] || 0) + 1;
    });

    const priceChartData = Object.keys(priceBuckets).map(key => ({
        range: key,
        count: priceBuckets[key]
    }));

    return {
      volume: totalVolume,
      avgPrice,
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
      rarityChartData,
      priceChartData,
      count: data.length
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Container>
        <NoData>No data available for analysis. Please adjust filters.</NoData>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>📈 Pulse Strategic Dashboard</Title>
        <Subtitle>Snapshot Analysis of Current View ({metrics?.count} items)</Subtitle>
      </Header>

      <Grid>
        <Card>
          <Label>Listing Volume (View)</Label>
          <Value>{metrics?.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Value>
          <Unit>BCOIN/SEN</Unit>
        </Card>
        <Card>
          <Label>Avg. Price</Label>
          <Value>{metrics?.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Value>
          <Unit>BCOIN/SEN</Unit>
        </Card>
        <Card>
          <Label>Floor Price</Label>
          <Value>{metrics?.minPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Value>
        </Card>
         <Card>
          <Label>Highest Listing</Label>
          <Value>{metrics?.maxPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Value>
        </Card>
      </Grid>

      {totalCount && (
         <GlobalStats>
             Global Marketplace Listings: <strong>{totalCount.toLocaleString()}</strong>
         </GlobalStats>
      )}

      <ChartsRow>
        <ChartCard>
           <ChartTitle>Rarity Distribution</ChartTitle>
           <ResponsiveContainer width="100%" height={300}>
             <PieChart>
               <Pie
                 data={metrics?.rarityChartData}
                 cx="50%"
                 cy="50%"
                 labelLine={false}
                 label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                 outerRadius={80}
                 fill="#8884d8"
                 dataKey="value"
               >
                 {metrics?.rarityChartData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <Tooltip contentStyle={{ backgroundColor: '#242735', borderColor: '#3f445b', color: '#fff' }} />
               <Legend />
             </PieChart>
           </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
           <ChartTitle>Price Distribution</ChartTitle>
           <ResponsiveContainer width="100%" height={300}>
             <BarChart data={metrics?.priceChartData}>
               <CartesianGrid strokeDasharray="3 3" stroke="#3f445b" />
               <XAxis dataKey="range" stroke="#7680ab" />
               <YAxis stroke="#7680ab" />
               <Tooltip cursor={{fill: '#3a3f54'}} contentStyle={{ backgroundColor: '#242735', borderColor: '#3f445b', color: '#fff' }} />
               <Bar dataKey="count" fill="#ff973a" />
             </BarChart>
           </ResponsiveContainer>
        </ChartCard>
      </ChartsRow>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  animation: fadeIn 0.5s ease-in-out;
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.primary};
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  font-size: 1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surfaceLight};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Value = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.75rem;
  font-family: ${({ theme }) => theme.fonts.primary};
  font-weight: bold;
`;

const Unit = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.75rem;
  opacity: 0.7;
`;

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ChartCard = styled.div`
  background: ${({ theme }) => theme.colors.surfaceLight};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  min-height: 350px;
`;

const ChartTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: normal;
  text-align: center;
`;

const NoData = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1.2rem;
`;

const GlobalStats = styled.div`
    background: ${({ theme }) => theme.colors.surfaceLighter};
    padding: ${({ theme }) => theme.spacing.md};
    border-radius: 4px;
    color: ${({ theme }) => theme.colors.textSecondary};
    text-align: center;
    strong {
        color: ${({ theme }) => theme.colors.text};
        margin-left: 5px;
    }
`;

export default PulseDashboard;
