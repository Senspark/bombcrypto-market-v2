import React from "react";
import styled from "styled-components";
import BHeroCard from "../cards/market-bhero-card";
import BHeroCardHorizonal from "../cards/market-bhero-list";
import { SuspiciousFlag } from "../../types/hero";

interface HeroData {
  id: string | number;
  tokenId: string | number;
  rarity: number;
  level: number;
  bombPower: number;
  speed: number;
  stamina: number;
  bombCount: number;
  bombRange: number;
  abilities?: number[];
  abilitiesHeroS?: number[];
  amount: string | number | bigint;
  isToken?: string;
  skin: number;
  color: number;
  sellerWalletAddress?: string;
  suspicious?: SuspiciousFlag | null;
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

export default Statistics;
