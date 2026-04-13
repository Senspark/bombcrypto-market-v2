import React from "react";
import styled from "styled-components";
import { Tag } from "../common/style";
import { mapRarity, bcoinFormat, mapTag } from "../../utils/helper";
import { HeroIcon } from "../hero";
import { IMAGE_TOKEN_SHOW } from "../../utils/config";
import "../../styles/animations.css";

interface HeroData {
  token_id: string | number;
  rarity: number;
  level: number;
  amount: string | number | bigint;
  isToken?: string;
  skin: number;
  color: number;
}

interface BHeroCardProps {
  data: HeroData;
}

const BHeroFullWidth: React.FC<BHeroCardProps> = ({ data }) => {
  return (
    <Item>
      <div className="header">
        <Tag>#{data.token_id}</Tag>
        <Tag className={mapTag[data.rarity]}>{mapRarity(data.rarity)}</Tag>
      </div>

      <div className="icon-hero-wrap">
        <div className={`level-info ${data.level >= 6 ? "flaming-name" : ""}`}>
           LVL {data.level} {data.level >= 6 && <span className="godlike-badge">GODLIKE</span>}
        </div>
        <div className={data.level >= 6 ? "godlike-aura" : ""}>
          <HeroIcon data={data} />
        </div>
      </div>
      <div className="footer">
        <img
          src={IMAGE_TOKEN_SHOW[data?.isToken || ""] || "/icons/token.png"}
          alt=""
        />
        <b>{bcoinFormat(data.amount)} </b>
        <div className="toolip">{bcoinFormat(data.amount)}</div>
        <span>$3200</span>
      </div>
    </Item>
  );
};

const Item = styled.div`
  width: 14.5rem;
  border: solid 1px #343849;
  background-color: #191b24;
  padding: 0.563rem 0.438rem;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
  &:hover {
    background: #000000;
  }
  .header {
    display: flex;
    justify-content: space-between;
    & > div {
      margin: 0;
    }
  }
  .icon-hero-wrap {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    .level-info {
        font-size: 0.9rem;
        color: #fff;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }

    img {
      width: 6.875rem;
      height: 9rem;
    }
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2.563rem;
    margin-bottom: 1.125rem;
    img {
      width: 1.438rem;
      height: 1.563rem;
    }
    b {
      font-size: 1.25rem;
      font-weight: bold;
      line-height: 1.3;
      color: #fff;
      margin: 0px 0.438rem;
    }
    span {
      font-size: 0.938rem;
      line-height: 1.3;
      color: #fff;
    }
  }
`;

export default BHeroFullWidth;
