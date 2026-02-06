import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Tag, IconItem, IconSkill, IconCoinStake } from "../common/style";
import {
  mapRarity,
  skills,
  bcoinFormat,
  mapTag,
  levelToPower,
  mapRarityShield,
} from "../../utils/helper";
import Button from "../buttons/buy";
import { useAccount } from "../../context/account";
import { HeroIcon } from "../hero";
import { IMAGE_TOKEN_SHOW, HeroType } from "../../utils/config";
import { Tooltip } from "antd";
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

interface DashboardBheroProps {
  data: HeroData;
}

const BHeroFullWidth: React.FC<DashboardBheroProps> = ({ data }) => {
  const isHeroS =
    !_.isEmpty(data?.abilities_hero_s) &&
    !_.includes(data?.abilities_hero_s, 0);
  const abilities = data.abilities || [];
  const { clear, network } = useAccount();
  const addPower = levelToPower[data.level];
  const [shieldData, setShieldData] = useState<ShieldData | null>(null);
  const [staked, setStaked] = useState(0);
  const [stakedSen, setStakedSen] = useState(0);

  useEffect(() => {
    fetchData();
  }, [data]);

  const fetchData = async () => {
    const resp = await getShieldData(data.token_id, network);
    setShieldData(resp);
    setStaked(Math.floor(resp?.currentStakeBcoin || 0));
    setStakedSen(Math.floor(resp?.currentStakeSen || 0));
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
        <Tag className={"uppercase " + mapTag[data.rarity]}>
          {mapRarity(data.rarity)}{" "}
        </Tag>
      </div>
      <div className="info-skill">
        <div className="skill-item">
          {abilities.map((element) => (
            <IconItem
              key={element}
              src={"/skill/" + skills[element] + ".png"}
            />
          ))}
          {(isHeroS || shieldData?.heroType === HeroType.lStake) && (
            <Tooltip
              title={
                shieldData?.shieldAmount
                  ? shieldData?.shieldAmount
                  : `--/${mapRarityShield(data.rarity)}`
              }
              placement="top"
              overlayInnerStyle={{
                color: "black",
                backgroundColor: "white",
                fontWeight: "bold",
                opacity: "1",
                fontSize: "18px",
              }}
            >
              <IconItem style={{ cursor: "pointer" }} src={"/skill/shield_icon.png"} />
            </Tooltip>
          )}
        </div>
        <div className="flex-skill">
          <div className="skill">
            <IconSkill src="/icons/skill2.webp" />
            <span>
              {data.bomb_power}
              {addPower !== 0 && <em className="add">(+{addPower})</em>}
            </span>
          </div>
          <div className="skill">
            <IconSkill src="/icons/skill1.webp" />
            <span>{data.speed}</span>
          </div>
          <div className="skill">
            <IconSkill src="/icons/skill5.webp" />
            <span>{data.stamina}</span>
          </div>
          <div className="skill">
            <IconSkill src="/icons/skill3.webp" />
            <span>{data.bomb_count}</span>
          </div>
          <div className="skill">
            <IconSkill src="/icons/skill4.webp" />
            <span>{data.bomb_range}</span>
          </div>
        </div>
        <div>
          <div className="text">STAKED</div>
          <div className="flex-skill">
            <div className="skill">
              <IconCoinStake src="/icons/token.png" />
              <span>{staked ? staked : 0}</span>
            </div>
          </div>
          <div className="flex-skill">
            <div className="skill">
              <IconCoinStake src="/icons/sen_token.png" />
              <span>{stakedSen ? stakedSen : 0}</span>
            </div>
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
        <Button
          data={data}
          price={data.amount}
          id={data.token_id}
          fetchData={fetchData}
        />
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
  .info {
    min-width: 6.375rem;
  }
  .text {
    font-size: 1.375rem;
    font-weight: 500;
    color: #a6afd7;
  }
  .info-skill {
    min-width: 19.5rem;
  }
  .icon-hero {
    img {
      width: 4.875rem;
      height: 6.313rem;
    }
  }
  .flex-skill {
    display: flex;
    justify-content: space-between;
  }
  .skill-item {
    display: flex;
    img {
      margin-right: 0.75rem;
    }
  }
  .skill {
    display: flex;
    align-items: center;
    span {
      font-size: 1.375rem;
      font-weight: 500;
      line-height: 1.3;
      color: #fff;
      margin-left: 0.5rem;
      display: inline-block;
    }
  }
  .action {
    .top {
      display: flex;
      align-items: center;
      /* margin-bottom: 0.2rem; */
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
      color: #8d95b7;
      font-size: 1.125rem;
      box-sizing: border-box;
      margin-top: 0.438rem;
      line-height: 1;
      background: none;
      cursor: pointer;
      font-weight: 500;
    }
  }
  .bcoin-btn {
    max-width: 105px;
    float: right;
  }
`;

export default BHeroFullWidth;
