import React from "react";
import styled from "styled-components";
import BhouseCard from "../cards/market-bhouse";

interface HouseData {
  id: string | number;
  tokenId: string | number;
  rarity: number;
  capacity: number;
  sellerWalletAddress: string;
  amount: string | number | bigint;
  isToken?: string;
}

interface MarketBhouseListProps {
  data: HouseData[];
}

const Bhouse: React.FC<MarketBhouseListProps> = ({ data }) => {
  return (
    <Wrap>
      {data && data.length === 0 && (
        <div className="right-title">Bhouse not found</div>
      )}
      <List>
        {data &&
          data &&
          data.map((element) => (
            <BhouseCard key={element.id} data={element} />
          ))}
      </List>
    </Wrap>
  );
};

const Wrap = styled.div`
  min-height: 80vh;
`;

const List = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

export default Bhouse;
