import React from "react";
import styled from "styled-components";
import { Tag } from "../common/style";
import Copy from "../common/copy";
import ButtonBuy from "../buttons/buy-house";
import LinkProfile from "../common/link-profile";
import {
  bcoinFormat,
  mapTag,
  mapHouse,
  minAddress,
  mapHouseDetail,
} from "../../utils/helper";
import { IMAGE_TOKEN_SHOW } from "../../utils/config";

interface HouseData {
  token_id: string | number;
  rarity: number;
  capacity: number;
  seller_wallet_address: string;
  amount: string | number | bigint;
  isToken?: string;
}

interface MarketBhouseProps {
  data: HouseData;
  refesh?: () => void;
}

const BHeroFullWidth: React.FC<MarketBhouseProps> = ({ data, refesh }) => {
  const info = mapHouseDetail[data.rarity];

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

      <div className="flex-skill">
        <div>
          <div className="title">SIZE</div>
          <div className="skill">{info.size}</div>
        </div>
        <div>
          <div className="title">CHARGE</div>
          <div className="skill">{info.charge}</div>
        </div>
        <div>
          <div className="title">CAPACITY</div>
          <div className="skill">{data.capacity}</div>
        </div>
        <div className="owner">
          <div className="title">OWNER</div>
          <div className="skill">
            <div>{minAddress(data.seller_wallet_address)}</div>
            <Copy data={data.seller_wallet_address} />
          </div>
        </div>
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
        <div className="buy-wrap">
          <ButtonBuy
            data={data}
            reload={refesh}
            price={data.amount}
            id={data.token_id}
          />
          <div className="link">
            <LinkProfile id={data.token_id} type="bhouse" />
          </div>
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
  border: solid 1px #343849;
  background-color: #191b24;
  .info {
    width: 6.714rem;
    margin-right: 4rem;
    @media (min-width: 1440px) {
    }
  }

  .icon-hero {
    margin-right: 4rem;
    width: 8rem;
    text-align: center;
    img {
      height: 5.5rem;
      object-fit: cover;
    }
  }
  .flex-skill {
    display: flex;
    @media (min-width: 1440px) {
      margin-right: 4rem;
    }

    /* justify-content: space-between; */
    & > div {
      margin: 2.063rem 1.5rem;
      width: 4rem;
      @media (min-width: 1440px) {
        margin: 1.5rem;
      }
    }
    .owner {
      width: 8rem;
    }
    /* width: 30.313rem; */
    .title {
      font-size: 0.813rem;
      line-height: 1.31;
      color: #a6afd7;
      margin-bottom: 0.688rem;
      text-align: center;
      white-space: nowrap;
    }
    .copy {
      margin-left: 0.75rem;
      display: flex;
      align-items: center;
      cursor: pointer;

      &:hover {
        svg {
          height: 1.5rem;
          fill: white;
        }
      }
      svg {
        height: 1.5rem;
        fill: #c5cae1;
        transition: 0.3s ease-in-out;
      }
    }
  }
  .skill-item {
    display: flex;
    justify-content: space-between;

    img {
      margin-right: 0.75rem;
    }
  }
  .skill {
    font-size: 1.5rem;
    line-height: 1.31;
    text-align: center;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;

    span {
      color: #7a81a4;
      margin-right: 0.2rem;
      display: inline-block;
      width: 1.563rem;
    }
  }
  .action {
    display: flex;
    justify-content: space-between;
    width: 16.813rem;
    margin-left: auto;
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
      font-size: 1.125rem;
      color: #381a09;
      box-sizing: border-box;
      line-height: 1;
      background: none;
      cursor: pointer;
      font-weight: 500;
      border-radius: 3px;
      background-color: #ff973a;
      border: none;
      box-shadow: none;
    }
  }
  .buy-wrap {
    position: relative;
    .link {
      position: absolute;
      top: 102%;
      left: 0%;
    }
  }
`;

export default BHeroFullWidth;
