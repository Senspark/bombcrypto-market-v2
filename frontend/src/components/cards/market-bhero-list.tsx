import React from "react";
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
import { ShieldOutput, SuspiciousFlag } from "../../types/hero";
import { SuspiciousBadge } from "../common/suspicious";

interface HeroData {
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
  shieldData?: ShieldOutput | null;
  suspicious?: SuspiciousFlag | null;
}

interface MarketBheroListProps {
  data: HeroData;
  network: string;
}

const BHeroFullWidth: React.FC<MarketBheroListProps> = ({ data, network }) => {
  const isHeroS =
    !_.isEmpty(data?.abilitiesHeroS) &&
    !_.includes(data?.abilitiesHeroS, 0);
  const abilities = data.abilities || [];
  const addPower = levelToPower[data.level];
  const shieldData = data.shieldData ?? null;
  const staked = Math.floor(shieldData?.currentStakeBcoin || 0);
  const stakedSen = Math.floor(shieldData?.currentStakeSen || 0);

  return (
    <Item className={data.suspicious ? "suspicious" : ""}>
      <HeroIcon
        data={data}
        heroType={isHeroS ? HeroType.s : shieldData?.heroType as any}
      />
      <div className="info">
        <div className="level">Level {data.level}</div>
        <Tag>#{data.tokenId}</Tag>
        <Tag className={mapTag[data.rarity]}>{mapRarity(data.rarity)}</Tag>
        <SuspiciousBadge flag={data.suspicious} />
      </div>
      <div className="info-skill">
        <div className="flex-skill">
          <div className="power">
            <div className="title">POWER</div>
            <div className="skill">
              <IconSkill src="/icons/skill2.webp" />
              <span>
                {data.bombPower}
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

              <span>{data.bombCount}</span>
            </div>
          </div>
          <div>
            <div className="title">RANGE</div>
            <div className="skill">
              <IconSkill src="/icons/skill4.webp" />
              <span>{data.bombRange}</span>
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
        <div>
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
            id={data.tokenId}
            fetchData={() => {}}
          />
          <div className="link">
            <LinkProfile type="bhero" id={data.tokenId} />
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
  &.suspicious {
    border-color: #ff0759;
  }
  padding: 1.125rem 1.313rem;
  gap: 1rem;
  min-height: 12rem;
  border: solid 1px #343849;
  background-color: #191b24;
  .info {
    width: 12rem;
    flex-shrink: 0;
  }

  .icon-hero {
    flex-shrink: 0;
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
    flex-wrap: wrap;
    column-gap: 0.5rem;
    row-gap: 0.5rem;
    & > div {
      min-width: 4rem;
      &.power {
        min-width: 5rem !important;
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
    row-gap: 0.5rem;
    justify-content: flex-end;
    flex: 1 1 0;
    min-width: 0;
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
    flex-shrink: 0;
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

export default BHeroFullWidth;
