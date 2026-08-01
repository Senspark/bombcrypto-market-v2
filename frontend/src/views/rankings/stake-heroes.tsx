import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useAccount } from "../../context/account";
import { mapRarity } from "../../utils/helper";
import {
  fetchHeroStakeRanking,
  HeroStakeRankingResponse,
  StakeToken,
} from "../../utils/explorer/api";
import RankingHeroCard from "../../components/cards/ranking-hero";
import Pagination from "../../components/layouts/Pagination";
import Loading from "../../components/layouts/loading";
import {
  formatAmount,
  HeaderOptions,
  Page,
  RankingContent,
  RankingTabs,
  SelectWrap,
  SummaryCards,
  TokenSelect,
  WrapPagination,
} from "./shared";

const PAGE_SIZE = 20;
const RARITY_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const TOKEN_ICON: Record<StakeToken, string> = {
  BCOIN: "/icons/token.png",
  SEN: "/icons/sen_token.png",
};

/** Ranking of the heroes with the biggest stake, per token and rarity. */
const RankingStakeHeroes: React.FC = () => {
  const { network } = useAccount();
  const history = useHistory();
  const location = useLocation();

  // Filters start from the URL so ranking links are shareable
  const init = useMemo(() => new URLSearchParams(location.search), []);
  const initRarity = parseInt(init.get("rarity") ?? "", 10);

  const [token, setToken] = useState<StakeToken>(init.get("token") === "sen" ? "SEN" : "BCOIN");
  // Mixing every rarity in one list is confusing (stake scales differ wildly),
  // so a rarity is always selected - Common is the entry point
  const [rarity, setRarity] = useState<number>(
    isNaN(initRarity) || initRarity < 0 || initRarity > 9 ? 0 : initRarity
  );
  const [consolidated, setConsolidated] = useState(init.get("all") === "1");
  const [page, setPage] = useState(parseInt(init.get("page") ?? "", 10) || 1);
  const [data, setData] = useState<HeroStakeRankingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // A page from the previous network may not exist on the new one
  useEffect(() => {
    setPage(1);
  }, [network]);

  // Every filter change is reflected in the URL (defaults omitted)
  useEffect(() => {
    const query = new URLSearchParams();
    // NetworkUrlSync owns ?network=; keep it when rebuilding the query
    const networkParam = new URLSearchParams(window.location.search).get("network");
    if (networkParam) query.set("network", networkParam);
    if (token === "SEN") query.set("token", "sen");
    query.set("rarity", String(rarity));
    if (consolidated) query.set("all", "1");
    if (page > 1) query.set("page", String(page));
    const search = query.toString();
    history.replace(location.pathname + (search ? "?" + search : ""));
  }, [token, rarity, consolidated, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchHeroStakeRanking(network, { token, rarity, consolidated, page, size: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [network, token, rarity, consolidated, page]);

  const summary = data?.summary;

  return (
    <Page>
      <RankingTabs />
      <HeaderOptions style={{ padding: "0.75rem 1.5rem 0 0" }}>
        <SelectWrap>
          <select
            value={consolidated ? "all" : "current"}
            onChange={(e) => {
              setPage(1);
              setConsolidated(e.target.value === "all");
            }}
          >
            <option value="current">Current network</option>
            <option value="all">Consolidated (BSC + POL)</option>
          </select>
        </SelectWrap>
        <SelectWrap>
          <select
            value={String(rarity)}
            onChange={(e) => {
              setPage(1);
              setRarity(parseInt(e.target.value, 10));
            }}
          >
            {RARITY_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {mapRarity(r)}
              </option>
            ))}
          </select>
        </SelectWrap>
        <TokenSelect
          value={token}
          onChange={(value) => {
            setPage(1);
            setToken(value);
          }}
        />
      </HeaderOptions>

      {summary && (
        <SummaryCards
          items={[
            {
              label: `Amount staked (${token})`,
              value: formatAmount(token === "SEN" ? summary.stake_sen : summary.stake_bcoin),
              icon: TOKEN_ICON[token],
            },
            { label: "Heroes staked", value: summary.heroes },
            { label: "Biggest stake", value: formatAmount(summary.biggest_stake), icon: TOKEN_ICON[token] },
            { label: "Avg per hero", value: formatAmount(summary.avg_stake), icon: TOKEN_ICON[token] },
          ]}
        />
      )}

      <RankingContent>
        {loading && (
          <div className="loading-in-local">
            <Loading />
          </div>
        )}
        {!loading && (!data || data.items.length === 0) && (
          <div className="empty">No staked heroes found</div>
        )}
        {!loading && data && data.items.length > 0 && (
          <div className="list">
            {data.items.map((hero) => (
              <RankingHeroCard
                key={hero.network + "-" + hero.bomber_id}
                data={hero}
                showNetwork={consolidated}
              />
            ))}
          </div>
        )}
        <WrapPagination>
          <Pagination
            name="page"
            page={page}
            total_page={data?.total_pages}
            onChange={(_name, value) => setPage(value)}
          />
        </WrapPagination>
      </RankingContent>
    </Page>
  );
};

export default RankingStakeHeroes;
