import React from "react";
import styled from "styled-components";
import { Tag } from "../common/style";
import { bcoinFormat, mapTag, mapHouse, minAddress } from "../../utils/helper";

interface HouseData {
  token_id: string | number;
  rarity: number;
  buyer_wallet_address?: string;
  seller_wallet_address?: string;
  amount: string | number | bigint;
}

interface DashboardBhouseSoldProps {
  data: HouseData;
}

const BHeroFullWidth: React.FC<DashboardBhouseSoldProps> = ({ data }) => {
  return (
    <Item>
      <div className="icon-hero">
        <img
          src={"/house/" + mapHouse[data.rarity].replace(" ", "") + ".png"}
          alt=""
        />
      </div>
      <div className="info">
        <Tag>#{data.token_id}</Tag>
        <Tag className={mapTag[data.rarity]}>{mapHouse[data.rarity]}</Tag>
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
          <img src="/icons/token.png" alt="" />
          <span>{bcoinFormat(data.amount)}</span>
          <div className="toolip">{bcoinFormat(data.amount)}</div>
        </div>
      </div>
    </Item>
  );
};

const Item = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 1.125rem 1.313rem;
  justify-content: space-between;
  border-top: solid 1px #343849;
  height: 12rem;

  .icon-hero {
    margin-right: 1rem;
    width: 6rem;
    text-align: center;
    img {
      height: 5.5rem;
      width: 5.5rem;
      object-fit: contain;
    }
  }
  .info {
    min-width: 9.375rem;
  }

  .action {
    display: flex;
    min-width: 8rem;
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
  }
  .buyer,
  .seller {
    flex: 1;
    p {
      margin: 0;
    }
    .title {
      font-size: 1.156rem;
      white-space: nowrap;
      color: #8d95b7;
      line-height: 1.3;
    }
    .name {
      font-size: 1.156rem;
      color: white;
      white-space: nowrap;
    }
    .address {
      font-size: 0.938rem;
      color: #484f70;
    }
  }
`;

export default BHeroFullWidth;
