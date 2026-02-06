import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Tag, IconItem, IconSkill, IconCoinStake } from "../common/style";
import ButtonBuy from "../buttons/buy";
import LinkProfile from "../common/link-profile";
import {
  mapRarity,
  skills,
  bcoinFormat,
  mapTag,
  levelToPower,
  mapRarityShield,
} from "../../utils/helper";
import { HeroIcon } from "../hero";
import _ from "lodash";
import { IMAGE_TOKEN_SHOW, HeroType } from "../../utils/config";
import { getShieldData } from "../Service/api";

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

interface MarketBheroListProps {
  data: HeroData;
  network: string;
}

const BHeroFullWidth: React.FC<MarketBheroListProps> = ({ data, network }) => {
  const isHeroS =
    !_.isEmpty(data?.abilities_hero_s) &&
    !_.includes(data?.abilities_hero_s, 0);
  const abilities = data.abilities || [];
  const addPower = levelToPower[data.level];
  const [shieldData, setShieldData] = useState<ShieldData | null>(null);
  const [staked, setStaked] = useState(0);
  const [stakedSen, setStakedSen] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

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
        heroType={isHeroS ? HeroType.s : shieldData?.heroType as any}
      />
      <div className="info">
        <div className="level">Level {data.level}</div>
        <Tag>#{data.token_id}</Tag>
        <Tag className={mapTag[data.rarity]}>{mapRarity(data.rarity)}</Tag>
      </div>
      <div style={{ width: "35rem" }}>
        <div className="flex-skill">
          <div className="power">
            <div className="title">POWER</div>
            <div className="skill">
              <IconSkill src="/icons/skill2.webp" />
              <span>
                {data.bomb_power}
                {addPower !== 0 && <em className="add">(+{addPower})</em>}
              </span>
            </div>
          </div>
          <div>
            <div className="title">SPEED</div>
            <div className="skill">
              <IconSkill src="/icons/skill1.webp" />
              <span>{data.speed}</span>
            </div>
          </div>
          <div>
            <div className="title">STAMINA</div>
            <div className="skill">
              <IconSkill src="/icons/skill5.webp" />
              <span>{data.stamina}</span>
            </div>
          </div>
          <div>
            <div className="title">BOMB NUM</div>
            <div className="skill">
              <IconSkill src="/icons/skill3.webp" />

              <span>{data.bomb_count}</span>
            </div>
          </div>
          <div>
            <div className="title">RANGE</div>
            <div className="skill">
              <IconSkill src="/icons/skill4.webp" />
              <span>{data.bomb_range}</span>
            </div>
          </div>
          {(isHeroS || shieldData?.heroType === HeroType.lStake) && (
            <div className="wrap-shield">
              <div className="content-shield">
                <div className="title">SHIELD</div>
                <div className="custom-shield">
                  <div className="skill">
                    <IconSkill
                      className="shield-icon"
                      src="/icons/shield_lightning.png"
                    />
                  </div>
                  <div className="shield">
                    <span className="fs-shield">
                      {shieldData?.shieldAmount
                        ? shieldData?.shieldAmount
                        : `--/${mapRarityShield(data.rarity)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
      <div className="skill-item" style={{ width: "25rem" }}>
        {abilities
          .sort(function (a, b) {
            return a - b;
          })
          .map((element) => (
            <IconItem
              key={element}
              src={"/skill/" + skills[element] + ".png"}
            />
          ))}

        {(isHeroS || shieldData?.heroType === HeroType.lStake) && (
          <IconItem src={"/skill/shield_icon.png"} />
        )}
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
            price={data.amount}
            id={data.token_id}
            fetchData={fetchData}
          />
          <div className="link">
            <LinkProfile type="bhero" id={data.token_id} />
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
    width: 8rem;
  }

  .icon-hero {
    img {
      width: 4.875rem;
      height: 6.313rem;
    }
  }
  .text {
    margin-top: 7px;
    font-size: 0.813rem;
    line-height: 1.31;
    color: #a6afd7;
    margin-bottom: 0.688rem;
  }
  .flex-skill {
    display: flex;
    min-width: 19.313rem;
    & > div {
      width: 5rem;
      &.power {
        min-width: 6rem !important;
      }
    }

    @media (min-width: 1440px) {
      & > div {
        width: 5rem;
      }
      & > .wrap-shield {
        width: 5rem;
      }
    }

    .title {
      font-size: 0.813rem;
      line-height: 1.31;
      color: #a6afd7;
      margin-bottom: 0.688rem;
    }
  }
  .skill-item {
    display: flex;
    /* justify-content: space-between; */
    min-width: 20rem;
    img {
      margin-right: 0.75rem;
    }
  }
  .content-shield {
    flex-direction: column;
    display: flex;
    align-items: center;
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
  .shield {
    color: #fff;
    font-weight: 500;
    line-height: 1.8;
    /* display: inline-block; */
  }
  .action {
    display: flex;
    justify-content: space-between;
    width: 14rem;
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
  .buy-wrap {
    position: relative;
    .link {
      position: absolute;
      top: 102%;
      left: 0%;
    }
  }
  .custom-shield {
    display: flex;
  }
`;

// ⚡ Bolt: Wrapped in React.memo to prevent unnecessary re-renders.
// This component is rendered in a large list, so avoiding re-renders when data hasn't changed is critical for performance.
export default React.memo(BHeroFullWidth);
