import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useAccount } from "../../context/account";
import {
  fetchWalletHeroes,
  fetchWalletProfile,
  WalletHeroesResponse,
  WalletProfile,
} from "../../utils/explorer/api";
import RankingHeroCard from "../../components/cards/ranking-hero";
import ExplorerHouseCard from "../../components/cards/explorer-house";
import Pagination from "../../components/layouts/Pagination";
import Loading from "../../components/layouts/loading";
import { formatAmount, Page, SummaryCards, WrapPagination } from "../rankings/shared";
import { ExplorerContent, ExplorerHint, ExplorerSearch, ExplorerTabs } from "./shared";

const PAGE_SIZE = 10;

/** Wallet profile: counters, stake + ranking positions, heroes and houses. */
const ExplorerWallet: React.FC = () => {
  const { network, auth } = useAccount();
  const history = useHistory();
  const location = useLocation();
  const { address } = useParams<{ address?: string }>();
  // Coming from the consolidated ranking, the profile must show the same
  // consolidated totals and position
  const consolidated = new URLSearchParams(location.search).get("all") === "1";

  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [heroes, setHeroes] = useState<WalletHeroesResponse | null>(null);
  const [heroesLoading, setHeroesLoading] = useState(false);
  const [stakedOnly, setStakedOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setProfile(null);
    setNotFound(false);
    setFailed(false);
    setHeroes(null);
    setPage(1);
    if (!address) return;

    let cancelled = false;
    setLoading(true);
    fetchWalletProfile(network, address, consolidated)
      .then((result) => {
        if (!cancelled) setProfile(result);
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
  }, [network, address, consolidated]);

  useEffect(() => {
    if (!address || !profile) return;

    let cancelled = false;
    setHeroesLoading(true);
    fetchWalletHeroes(network, address, { stakedOnly, page, size: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) setHeroes(result);
      })
      .catch(() => {
        if (!cancelled) setHeroes(null);
      })
      .finally(() => {
        if (!cancelled) setHeroesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [network, address, profile, stakedOnly, page]);

  return (
    <Page>
      <ExplorerTabs />
      <ExplorerSearch
        placeholder="Search wallet (0x...)"
        initial={address}
        onSearch={(value) => history.push("/explorer/wallet/" + value.toLowerCase())}
      />
      {!address && auth.address && (
        <MyWallet onClick={() => history.push("/explorer/wallet/" + auth.address.toLowerCase())}>
          View my wallet ({auth.address})
        </MyWallet>
      )}

      {!address && <ExplorerHint>Enter a wallet address above to explore it.</ExplorerHint>}
      {notFound && <ExplorerHint>Wallet not found on this server.</ExplorerHint>}
      {failed && <ExplorerHint>Could not load the data. Try again.</ExplorerHint>}
      {loading && (
        <ExplorerContent>
          <div className="loading-in-local">
            <Loading />
          </div>
        </ExplorerContent>
      )}

      {profile && (
        <>
          <WalletHeader title={profile.wallet}>{profile.wallet}</WalletHeader>
          <SummaryCards
            items={[
              { label: "Heroes", value: profile.heroes },
              { label: "Heroes staked", value: profile.heroes_staked },
              { label: "Houses", value: profile.houses.length },
              {
                label: "Stake BCOIN" + (profile.rank_bcoin ? ` — rank #${profile.rank_bcoin}` : ""),
                value: formatAmount(profile.stake_bcoin),
                icon: "/icons/token.png",
              },
              {
                label: "Stake SEN" + (profile.rank_sen ? ` — rank #${profile.rank_sen}` : ""),
                value: formatAmount(profile.stake_sen),
                icon: "/icons/sen_token.png",
              },
            ]}
          />

          <ExplorerContent>
            {profile.houses.length > 0 && (
              <>
                <div className="section-title">Houses ({profile.houses.length})</div>
                <div className="list">
                  {profile.houses.map((house) => (
                    <ExplorerHouseCard
                      key={house.house_id}
                      houseId={house.house_id}
                      rarity={house.rarity}
                      recovery={house.recovery}
                      maxBomber={house.max_bomber}
                      active={house.active}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="section-title">
              Heroes {heroes ? `(${heroes.total_count})` : ""}
              <label className="staked-filter">
                <input
                  type="checkbox"
                  checked={stakedOnly}
                  onChange={(e) => {
                    setPage(1);
                    setStakedOnly(e.target.checked);
                  }}
                />
                With stake only
              </label>
            </div>
            {heroesLoading && (
              <div className="loading-in-local">
                <Loading />
              </div>
            )}
            {!heroesLoading && heroes && heroes.items.length === 0 && (
              <div className="empty">No heroes found</div>
            )}
            {!heroesLoading && heroes && heroes.items.length > 0 && (
              <div className="list">
                {heroes.items.map((hero) => (
                  <RankingHeroCard key={hero.bomber_id} data={hero} showWallet={false} />
                ))}
              </div>
            )}
            <WrapPagination>
              <Pagination
                name="page"
                page={page}
                total_page={heroes?.total_pages}
                onChange={(_name, value) => setPage(value)}
              />
            </WrapPagination>
          </ExplorerContent>
        </>
      )}
    </Page>
  );
};

const WalletHeader = styled.div`
  padding: 1.688rem 1.25rem 0;
  font-family: "agency-fb-regular", sans-serif;
  font-size: 2.5rem;
  color: #fff;
  word-break: break-all;
`;

const MyWallet = styled.div`
  padding: 0.75rem 1.25rem 0;
  color: #ff973a;
  font-size: 1.063rem;
  cursor: pointer;
  word-break: break-all;
  &:hover {
    text-decoration: underline;
  }
`;

export default ExplorerWallet;
