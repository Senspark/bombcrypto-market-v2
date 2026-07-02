import React from "react";
import styled from "styled-components";
import { Tag, IconItem, IconSkill, IconCoinStake } from "../common/style";
import ButtonBuy from "../buttons/buy";
import { Copy as CopyIcon } from "../icons";
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
import { ShieldOutput } from "../../types/hero";

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
  shieldData?: ShieldOutput | null;
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
  const shieldData = data.shieldData ?? null;
  const staked = Math.floor(shieldData?.currentStakeBcoin || 0);
  const stakedSen = Math.floor(shieldData?.currentStakeSen || 0);

  return (
    <Item>
      <HeroIcon
        data={data}
        heroType={isHeroS ? HeroType.s : (shieldData?.heroType as any)}
      />
      <div className="info">
        <div className="level">Level {data.level}</div>
        <Tag
          className="id-tag"
          title="Copiar ID"
          onClick={() =>
            navigator.clipboard?.writeText(String(data.token_id))
          }
        >
          #{data.token_id}
          <CopyIcon />
        </Tag>
        <Tag className={mapTag[data.rarity]}>{mapRarity(data.rarity)}</Tag>
      </div>
      <div className="stats-block">
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
                        : `?/${mapRarityShield(data.rarity)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="staked-col">
        <div className="text">STAKED</div>
        <div className="flex-skill">
          <div className="skill">
            <IconCoinStake src="/icons/token.png" />
            <span>{shieldData ? staked : "?"}</span>
          </div>
        </div>
        <div className="flex-skill">
          <div className="skill">
            <IconCoinStake src="/icons/sen_token.png" />
            <span>{shieldData ? stakedSen : "?"}</span>
          </div>
        </div>
      </div>
      <div className="skill-item">
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
            fetchData={() => {}}
          />
        </div>
      </div>
    </Item>
  );
};

const Item = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 1.125rem 1.5rem;
  justify-content: flex-start;
  gap: 1rem;
  border: solid 1px var(--border, #343849);
  background-color: var(--surface, #191b24);
  border-radius: var(--radius, 10px);
  margin-bottom: 0.875rem;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  &:hover {
    border-color: var(--accent, #ff973a);
    box-shadow: var(--shadow, 0 6px 20px rgba(0, 0, 0, 0.35));
    transform: translateY(-2px);
  }
  .info {
    width: 8rem;
  }
  .id-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    transition: filter 0.15s ease;
    svg {
      height: 0.85rem;
      width: 0.85rem;
      fill: currentColor;
      opacity: 0.9;
    }
    &:hover {
      filter: brightness(1.1);
    }
    &:active {
      transform: scale(0.96);
    }
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

    @media (max-width: 820px) {
      min-width: 0;
      flex-wrap: wrap;
      gap: 0.5rem 0.9rem;
      & > div {
        width: 3.75rem;
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
    flex-wrap: wrap;
    gap: 0.5rem;
    /* justify-content: space-between; */
    min-width: 10rem;
    img {
      margin-right: 0;
      background-color: var(--surface-2, #272d47);
      border-radius: 8px;
      padding: 0.25rem;
      box-sizing: border-box;
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
  .staked-col {
    margin-left: auto;
    min-width: 4.5rem;
    .text {
      margin-top: 0;
    }
    .flex-skill {
      min-width: auto;
      margin-top: 0.4rem;
    }
  }
  .action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
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
    /* .link {
      position: absolute;
      top: 102%;
      left: 0%;
    } */
  }
  .custom-shield {
    display: flex;
  }

  @media (max-width: 820px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.85rem;
    .info {
      width: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stats-block,
    .staked-col,
    .skill-item,
    .action {
      margin-left: 0;
    }
    .flex-skill {
      justify-content: center;
    }
    .staked-col .flex-skill {
      justify-content: center;
    }
    .skill-item {
      justify-content: center;
      min-width: 0;
    }
    .action {
      width: auto;
      flex-direction: column;
      gap: 0.6rem;
      align-items: center;
    }
  }
`;

export default BHeroFullWidth;
