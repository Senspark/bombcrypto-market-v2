import React from "react";
import styled from "styled-components";
import { Tag } from "../common/style";
import ButtonBuy from "../buttons/buy-house";
import {
  bcoinFormat,
  mapTag,
  mapHouse,
  mapHouseDetail,
} from "../../utils/helper";
import { IMAGE_TOKEN_SHOW } from "../../utils/config";

interface HouseData {
  token_id: string | number;
  rarity: number;
  capacity: number;
  amount: string | number | bigint;
  isToken?: string;
  seller_wallet_address?: string;
}

interface DashboardBhouseProps {
  data: HouseData;
}

const BHeroFullWidth: React.FC<DashboardBhouseProps> = ({ data }) => {
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
          <div className="skill"> {info.size} </div>
        </div>
        <div>
          <div className="title">CHARGE</div>
          <div className="skill">{info.charge}</div>
        </div>
        <div>
          <div className="title">CAPACITY</div>
          <div className="skill">{data.capacity}</div>
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
        <ButtonBuy data={data} price={data.amount} id={data.token_id} />
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
  .info {
    width: 6.571rem;
    margin-right: 1rem;
  }
  .icon-hero {
    margin-right: 2rem;
    width: 8rem;
    text-align: center;
    img {
      height: 5.5rem;
      width: 5.5rem;
      object-fit: contain;
    }
  }
  .flex-skill {
    display: flex;
    flex: 1;
    margin-right: 2rem;
    & > div {
      width: 5rem;
      @media (min-width: 1440px) {
        /* margin: 2.063rem 0; */
        width: 5rem;
      }
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
    text-align: left;
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
    width: fit-content;
    margin-left: auto;
    .top {
      display: flex;
      align-items: center;
      margin-bottom: 0.3rem;
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
`;

export default BHeroFullWidth;
