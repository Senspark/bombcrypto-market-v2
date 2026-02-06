import React from "react";
import styled from "styled-components";
import BHeroCard from "../cards/market-bhero-card";
import BHeroCardHorizonal from "../cards/market-bhero-list";

interface HeroData {
  id: string | number;
  token_id: string | number;
  rarity: number;
  level: number;
  bomb_power: number;
  speed: number;
  stamina: number;
  bomb_count: number;
  bomb_range: number;
  abilities?: number[];
  abilities_hero_s?: number[];
  amount: string | number | bigint;
  isToken?: string;
  skin: number;
  color: number;
  seller_wallet_address?: string;
}

interface MarketBheroListProps {
  view: "list" | "card";
  data: HeroData[];
  network: string;
}

const Statistics: React.FC<MarketBheroListProps> = ({ view, data, network }) => {
  const Com = view === "list" ? BHeroCardHorizonal : BHeroCard;
  return (
    <Wrap>
      {data && data.length === 0 && (
        <div className="right-title">Bhero not found</div>
      )}
      <List>
        {data &&
          data.map((element) => {
            return (
              <Com key={element.id} data={element} network={network} />
            );
          })}
      </List>
    </Wrap>
  );
};

const List = styled.div`
  min-height: 80vh;
`;

const Wrap = styled.div`
  min-height: 80vh;
`;

// ⚡ Bolt: Wrapped in React.memo to prevent unnecessary re-renders.
// This prevents the entire list from re-rendering when parent state (like search input) changes but list data remains the same.
export default React.memo(Statistics);
