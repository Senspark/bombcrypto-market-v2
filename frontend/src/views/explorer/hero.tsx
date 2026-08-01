import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Link, useHistory, useParams } from "react-router-dom";
import { useAccount } from "../../context/account";
import { fetchHeroDetail, HeroDetail } from "../../utils/explorer/api";
import { HeroIcon } from "../../components/hero";
import { Tag, IconItem, IconSkill, IconCoinStake } from "../../components/common/style";
import {
  mapRarity,
  mapTag,
  numberFormat,
  skills,
  skillsDesc,
} from "../../utils/helper";
import Loading from "../../components/layouts/loading";
import { Page } from "../rankings/shared";
import { ExplorerContent, ExplorerHint, ExplorerSearch, ExplorerTabs } from "./shared";

/** Page size of /rankings/stake - used to deep-link a rank to its page. */
const RANKING_PAGE_SIZE = 20;

/** Hero detail: stats, skills, owner and stake ranking positions. */
const ExplorerHero: React.FC = () => {
  const { network } = useAccount();
  const history = useHistory();
  const { id } = useParams<{ id?: string }>();

  const [hero, setHero] = useState<HeroDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHero(null);
    setNotFound(false);
    setFailed(false);
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    fetchHeroDetail(network, id)
      .then((result) => {
        if (!cancelled) setHero(result);
      })
      .catch((err) => {
        // Only a 404 means "does not exist"; anything else is a failure to load
        if (cancelled) return;
        if (err?.response?.status === 404) setNotFound(true);
        else setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [network, id]);

  const abilities = hero ? [...hero.abilities].sort((a, b) => a - b) : [];

  return (
    <Page>
      <ExplorerTabs />
      <ExplorerSearch
        placeholder="Search hero by id (e.g. 35033)"
        initial={id}
        onSearch={(value) => history.push("/explorer/hero/" + value.replace(/[^0-9]/g, ""))}
      />

      {!id && <ExplorerHint>Enter a hero id above to explore it.</ExplorerHint>}
      {notFound && <ExplorerHint>Hero not found on this server.</ExplorerHint>}
      {failed && <ExplorerHint>Could not load the data. Try again.</ExplorerHint>}
      {loading && (
        <ExplorerContent>
          <div className="loading-in-local">
            <Loading />
          </div>
        </ExplorerContent>
      )}

      {hero && (
        <ExplorerContent>
          <Detail>
            <div className="left">
              <div className={hero.burned ? "sprite burned" : "sprite"}>
                <HeroIcon
                  data={hero}
                  iconStyle={{ display: "none" }}
                />
                {hero.burned && <Fire src="/icons/fire.png" alt="" />}
              </div>
              <div className="tags">
                <Tag>#{hero.bomber_id}</Tag>
                <Tag className={mapTag[hero.rarity]}>{mapRarity(hero.rarity)}</Tag>
                <div className="level">Level {hero.level}</div>
                {hero.has_delete && (
                  <div className="gone">
                    {hero.burned
                      ? "Burned (converted to rock)"
                      : "No longer in the owner's inventory"}
                  </div>
                )}
              </div>
            </div>

            <div className="middle">
              <div className="block-title">STATS</div>
              <div className="stats">
                <div>
                  <div className="title">POWER</div>
                  <div className="skill">
                    <IconSkill src="/icons/skill2.webp" />
                    <span>{hero.power}</span>
                  </div>
                </div>
                <div>
                  <div className="title">SPEED</div>
                  <div className="skill">
                    <IconSkill src="/icons/skill1.webp" />
                    <span>{hero.speed}</span>
                  </div>
                </div>
                <div>
                  <div className="title">STAMINA</div>
                  <div className="skill">
                    <IconSkill src="/icons/skill5.webp" />
                    <span>{hero.stamina}</span>
                  </div>
                </div>
                <div>
                  <div className="title">BOMB NUM</div>
                  <div className="skill">
                    <IconSkill src="/icons/skill3.webp" />
                    <span>{hero.bomb_count}</span>
                  </div>
                </div>
                <div>
                  <div className="title">RANGE</div>
                  <div className="skill">
                    <IconSkill src="/icons/skill4.webp" />
                    <span>{hero.bomb_range}</span>
                  </div>
                </div>
              </div>

              <div className="block-title">SKILLS</div>
              <div className="skill-item">
                {abilities.length === 0 && <span className="none">None</span>}
                {abilities.map((element) =>
                  skills[element] ? (
                    <IconItem
                      key={element}
                      src={"/skill/" + skills[element] + ".png"}
                      title={skillsDesc[element]}
                    />
                  ) : (
                    <AbilityBadge key={element} title={"Ability " + element}>
                      A{element}
                    </AbilityBadge>
                  )
                )}
              </div>

              <div className="block-title">WALLET</div>
              {hero.wallet ? (
                <Link className="wallet-link" to={"/explorer/wallet/" + hero.wallet}>
                  {hero.wallet}
                </Link>
              ) : (
                <span className="none">unknown</span>
              )}
            </div>

            <div className="right">
              <StakeBlock
                icon="/icons/token.png"
                label="Stake BCOIN"
                amount={hero.stake_bcoin}
                rarity={hero.rarity}
                network={hero.network}
                rankNetworkRarity={hero.rank_bcoin_rarity}
                rankGlobalRarity={hero.rank_bcoin_global_rarity}
              />
              <StakeBlock
                icon="/icons/sen_token.png"
                label="Stake SEN"
                amount={hero.stake_sen}
                rarity={hero.rarity}
                network={hero.network}
                token="sen"
                rankNetworkRarity={hero.rank_sen_rarity}
                rankGlobalRarity={hero.rank_sen_global_rarity}
              />
            </div>
          </Detail>
        </ExplorerContent>
      )}
    </Page>
  );
};

const Detail = styled.div`
  display: flex;
  gap: 3rem;
  padding: 1.5rem;
  border: solid 1px #343849;
  background-color: #191b24;

  .left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    min-width: 12rem;

    .sprite {
      position: relative;
      display: flex;
      justify-content: center;
      /* a chama fica por fora deste seletor, então não é escurecida junto */
      &.burned > div img {
        filter: grayscale(0.65) brightness(0.5);
      }
    }

    .icon-hero img,
    & > div:first-child img:first-child {
      width: 9rem !important;
      height: auto !important;
    }

    .tags {
      display: flex;
      flex-direction: column;
      align-items: center;
      .level {
        color: #a6afd7;
        font-size: 1rem;
        margin-top: 0.25rem;
      }
      .gone {
        margin-top: 0.5rem;
        color: #ff5c5c;
        font-size: 0.875rem;
        text-align: center;
        max-width: 12rem;
      }
    }
  }

  .middle {
    flex: 1;

    .block-title {
      font-size: 0.875rem;
      color: #a6afd7;
      text-transform: uppercase;
      margin: 1.25rem 0 0.75rem;
      &:first-child {
        margin-top: 0;
      }
    }

    .stats {
      display: flex;
      & > div {
        width: 6.5rem;
      }
      .title {
        font-size: 0.813rem;
        color: #a6afd7;
        margin-bottom: 0.688rem;
      }
    }

    .skill {
      display: flex;
      align-items: center;
      span {
        font-size: 1.375rem;
        font-weight: 500;
        color: #fff;
        margin-left: 0.5rem;
      }
    }

    .skill-item {
      display: flex;
      img {
        margin-right: 0.75rem;
      }
    }

    .wallet-link {
      font-size: 1.125rem;
      color: #ff973a;
      text-decoration: none;
      word-break: break-all;
      &:hover {
        text-decoration: underline;
      }
    }

    .none {
      color: #a6afd7;
    }
  }

  .right {
    min-width: 17rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
`;

// Burned heroes are gone for good: the sprite is dimmed and a flame burns
// over it, so the state reads at a glance instead of only in the caption.
const flicker = keyframes`
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.95; }
  50%      { transform: translateX(-50%) scale(1.08); opacity: 1; }
`;

const Fire = styled.img`
  position: absolute;
  left: 50%;
  bottom: -0.75rem;
  width: 6rem;
  height: auto;
  transform: translateX(-50%);
  transform-origin: bottom center;
  pointer-events: none;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 0.75rem rgba(255, 122, 20, 0.55));
  animation: ${flicker} 1.6s ease-in-out infinite;
`;

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

interface StakeBlockProps {
  icon: string;
  label: string;
  amount: number;
  rarity: number;
  /** Hero's network: names the network-scoped ranking row. */
  network: string;
  /** Ranking token param; BCOIN is the default and needs no param. */
  token?: "sen";
  /** Position inside the hero's rarity ranking, per scope. */
  rankNetworkRarity: number | null;
  rankGlobalRarity: number | null;
}

/**
 * Stake amount of one token plus the hero's position in the ranking of its
 * own rarity, on its network and consolidated (BSC + Polygon). Each row
 * links to the ranking view it refers to.
 */
const StakeBlock: React.FC<StakeBlockProps> = ({
  icon,
  label,
  amount,
  rarity,
  network,
  token,
  rankNetworkRarity,
  rankGlobalRarity,
}) => {
  const tokenParam = token ? "token=" + token + "&" : "";
  const networkName = network === "POLYGON" ? "Polygon" : "BSC";
  // Each row links to the ranking page where this very position is visible,
  // filtered by the hero's rarity and scrolled to the right page
  const pageParam = (rank: number | null): string =>
    rank && rank > RANKING_PAGE_SIZE ? "&page=" + Math.ceil(rank / RANKING_PAGE_SIZE) : "";
  // Position inside this hero's rarity ranking, on its own network and
  // consolidated across networks
  const rows: { label: string; rank: number | null; to: string }[] = [
    {
      label: networkName,
      rank: rankNetworkRarity,
      to: "/rankings/stake?" + tokenParam + "rarity=" + rarity + pageParam(rankNetworkRarity),
    },
    {
      label: "Global",
      rank: rankGlobalRarity,
      to: "/rankings/stake?" + tokenParam + "all=1&rarity=" + rarity + pageParam(rankGlobalRarity),
    },
  ];

  return (
    <StakeCard>
      <div className="head">
        <IconCoinStake src={icon} />
        <span>{label}</span>
      </div>
      <div className="amount">{numberFormat(amount, 0)}</div>
      {rankNetworkRarity && (
        <div className="ranks">
          <div className="ranks-title">{mapRarity(rarity)} ranking</div>
          {rows.map((row) =>
            row.rank ? (
              <Link className="rank-row" key={row.label} to={row.to}>
                <span>{row.label}</span>
                <em>#{row.rank}</em>
              </Link>
            ) : null
          )}
        </div>
      )}
    </StakeCard>
  );
};

const StakeCard = styled.div`
  border: solid 1px #343849;
  background-color: #11131b;
  padding: 1.25rem 1.5rem;

  .head {
    display: flex;
    align-items: center;
    color: #a6afd7;
    font-size: 0.875rem;
    text-transform: uppercase;
    img {
      margin-right: 0.5rem;
    }
  }

  .amount {
    font-family: "agency-fb-regular", sans-serif;
    font-size: 2.5rem;
    color: #fff;
    margin: 0.5rem 0;
  }

  .ranks {
    margin-top: 0.875rem;
    border-top: 1px solid #272d47;
    padding-top: 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ranks-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6d76a0;
    margin-bottom: 0.125rem;
  }

  .rank-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    color: #a6afd7;
    text-decoration: none;
    span {
      text-transform: uppercase;
      font-size: 0.813rem;
      letter-spacing: 0.02em;
    }
    em {
      font-style: normal;
      font-family: "agency-fb-regular", sans-serif;
      font-size: 1.375rem;
      color: #ff973a;
    }
    &:hover span {
      color: #fff;
    }
    &:hover em {
      text-decoration: underline;
    }
  }
`;

export default ExplorerHero;
