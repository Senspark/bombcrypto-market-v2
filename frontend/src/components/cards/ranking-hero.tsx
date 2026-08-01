import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Tag, IconItem, IconSkill, IconCoinStake } from "../common/style";
import { mapRarity, mapTag, minAddress, numberFormat, skills } from "../../utils/helper";
import { HeroIcon } from "../hero";
import { RankedHero } from "../../utils/explorer/api";

interface RankingHeroCardProps {
  data: RankedHero;
  /** Hide the owner column (e.g. inside that owner's wallet page). */
  showWallet?: boolean;
  /** Show the hero's network badge (consolidated rankings). */
  showNetwork?: boolean;
}

/**
 * One hero row of the stake ranking / wallet explorer. Same visual language
 * as the marketplace list card, but read-only: no buy button, and it links
 * to the hero / wallet explorer pages instead of the listing.
 */
const RankingHeroCard: React.FC<RankingHeroCardProps> = ({
  data,
  showWallet = true,
  showNetwork = false,
}) => {
  const abilities = [...data.abilities].sort((a, b) => a - b);
  // Carry the hero's network in the link: NetworkUrlSync switches the app
  // network when the detail page opens (e.g. a BSC hero clicked on Polygon).
  const networkParam = "network=" + (data.network === "POLYGON" ? "polygon" : "bsc");
  // Both links carry the hero's own network: NetworkUrlSync switches the app
  // network when the target page opens (e.g. a BSC hero seen on Polygon)
  const heroLink = "/explorer/hero/" + data.bomber_id + "?" + networkParam;
  const walletLink = data.wallet ? "/explorer/wallet/" + data.wallet + "?" + networkParam : "";

  return (
    <Item>
      {data.rank !== null && <div className="rank">#{data.rank}</div>}
      <HeroIcon data={data} />
      <div className="info">
        <div className="level">Level {data.level}</div>
        <Link to={heroLink}>
          <Tag className="link-tag">#{data.bomber_id}</Tag>
        </Link>
        <Tag className={mapTag[data.rarity]}>{mapRarity(data.rarity)}</Tag>
        {showNetwork && data.network && (
          <Tag className="network">{data.network === "POLYGON" ? "POL" : data.network}</Tag>
        )}
      </div>
      <div className="stats">
        <div className="flex-skill">
          <div>
            <div className="title">POWER</div>
            <div className="skill">
              <IconSkill src="/icons/skill2.webp" />
              <span>{data.power}</span>
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
        </div>
        <div className="skill-item">
          {abilities.map((element) =>
            skills[element] ? (
              <IconItem key={element} src={"/skill/" + skills[element] + ".png"} />
            ) : (
              <AbilityBadge key={element} title={"Ability " + element}>
                A{element}
              </AbilityBadge>
            )
          )}
        </div>
      </div>
      <div className="stake">
        <div className="title">STAKED</div>
        <div className="skill">
          <IconCoinStake src="/icons/token.png" />
          <span>{numberFormat(data.stake_bcoin, 0)}</span>
        </div>
        <div className="skill">
          <IconCoinStake src="/icons/sen_token.png" />
          <span>{numberFormat(data.stake_sen, 0)}</span>
        </div>
      </div>
      {showWallet && (
        <div className="owner">
          <div className="title">WALLET</div>
          {data.wallet ? (
            <Link className="wallet-link" to={walletLink} title={data.wallet}>
              {minAddress(data.wallet)}
            </Link>
          ) : (
            <span className="unknown">unknown</span>
          )}
        </div>
      )}
    </Item>
  );
};

const AbilityBadge = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  margin-right: 0.75rem;
  border-radius: 3px;
  background-color: #272d47;
  color: #a6afd7;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Item = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 1.125rem 1.313rem;
  justify-content: space-between;
  border: solid 1px #343849;
  background-color: #191b24;

  .rank {
    width: 4.5rem;
    font-family: "agency-fb-regular", sans-serif;
    font-size: 2rem;
    color: #ff973a;
  }

  .info {
    width: 9rem;
    .level {
      font-size: 0.938rem;
      color: #a6afd7;
    }
    a {
      text-decoration: none;
    }
    .link-tag:hover {
      filter: brightness(1.2);
    }
  }

  .title {
    font-size: 0.813rem;
    line-height: 1.31;
    color: #a6afd7;
    margin-bottom: 0.688rem;
  }

  .stats {
    width: 34rem;
  }

  .flex-skill {
    display: flex;
    & > div {
      width: 6rem;
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

  .skill-item {
    display: flex;
    margin-top: 0.875rem;
    img {
      margin-right: 0.75rem;
    }
  }

  .stake {
    width: 13rem;
    .skill {
      margin-bottom: 0.375rem;
    }
  }

  .owner {
    width: 10rem;
    .wallet-link {
      font-size: 1.125rem;
      color: #ff973a;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
    .unknown {
      color: #a6afd7;
    }
  }
`;

export default RankingHeroCard;
