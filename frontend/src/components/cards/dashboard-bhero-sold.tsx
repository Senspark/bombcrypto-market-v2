import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Tag } from "../common/style";
import { mapRarity, minAddress, bcoinFormat, mapTag } from "../../utils/helper";
import { HeroIcon } from "../hero";
import { IMAGE_TOKEN_SHOW, HeroType } from "../../utils/config";
import { useAccount } from "../../context/account";
import { getShieldData } from "../Service/api";
import _ from "lodash";

interface ShieldData {
  heroType?: string;
  shieldAmount?: string | number;
  currentStakeBcoin?: number;
  currentStakeSen?: number;
}

interface HeroData {
  token_id: string | number;
  rarity: number;
  level: number;
  buyer_wallet_address?: string;
  seller_wallet_address?: string;
  amount: string | number | bigint;
  isToken?: string;
  abilities_hero_s?: number[];
  skin: number;
  color: number;
}

interface DashboardBheroSoldProps {
  data: HeroData;
}

const BHeroFullWidth: React.FC<DashboardBheroSoldProps> = ({ data }) => {
  const isHeroS =
    !_.isEmpty(data?.abilities_hero_s) &&
    !_.includes(data?.abilities_hero_s, 0);
  const { network } = useAccount();
  const [shieldData, setShieldData] = useState<ShieldData | null>(null);

  useEffect(() => {
    if (!isHeroS) fetchData();
  }, [data]);

  const fetchData = async () => {
    const resp = await getShieldData(data.token_id, network);
    setShieldData(resp);
  };

  return (
    <Item>
      <HeroIcon
        data={data}
        heroType={isHeroS ? HeroType.s : (shieldData?.heroType as any)}
      />
      <div className="info">
        <div className="level">Level {data.level}</div>
        <Tag>#{data.token_id}</Tag>
        <Tag className={mapTag[data.rarity]}>{mapRarity(data.rarity)} </Tag>
      </div>
      <div className="buyer">
        <p className="title mavenpro">BUYER</p>
        <h3 className="name">User Name</h3>
        <p className="address">( {minAddress(data.buyer_wallet_address)})</p>
      </div>
      <div className="buyer">
        <p className="title mavenpro">SELLER</p>
        <h3 className="name">User Name</h3>
        <p className="address">({minAddress(data.seller_wallet_address)})</p>
      </div>
      <div className="action">
        <div className="top">
          <img
            src={IMAGE_TOKEN_SHOW[data?.isToken || ""] || "/icons/token.png"}
            alt=""
          />
          <span>{bcoinFormat(data.amount)}</span>
          <div className="toolip">{bcoinFormat(data.amount)}</div>
        </div>
      </div>
    </Item>
  );
};

const Item = styled.div`
  border-top: solid 1px #343849;
  display: flex;
  width: 100%;
  align-items: center;
  padding: 0.5rem 1.313rem;
  height: 12rem;
  justify-content: space-between;
  .icon-hero {
    img {
      width: 4.875rem;
      height: 6.313rem;
    }
  }

  .info {
    width: 6rem;
  }
  .action {
    min-width: 6rem;
    .top {
      display: flex;
      align-items: center;
    }
    img {
      width: 1.75rem;
      height: 2rem;
      object-fit: contain;
    }
    span {
      font-size: 1.313rem;
      font-weight: 500;
      line-height: 1.33;
      color: #fff;
      margin-left: 0.438rem;
    }
    button {
      padding: 0.938rem 2.125rem;
      border-radius: 3px;
      border: solid 2px #3f4564;
      font-size: 1.125rem;
      color: #8d95b7;
      box-sizing: border-box;
      margin-top: 0.438rem;
      line-height: 1.32;
      background: none;
      cursor: pointer;
    }
  }

  .buyer,
  .seller {
    p {
      margin: 0;
    }
    .title {
      font-size: 1.156rem;
      color: #8d95b7;
      line-height: 1.3;
    }
    .name {
      font-size: 1.156rem;
      color: white;
    }
    .address {
      font-size: 0.938rem;
      color: #484f70;
    }
  }
`;

export default BHeroFullWidth;
