import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useAccount } from "../../context/account";
import { numberFormat } from "../../utils/helper";
import {
  fetchWalletStakeRanking,
  StakeToken,
  WalletStakeRankingResponse,
} from "../../utils/explorer/api";
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

const TOKEN_ICON: Record<StakeToken, string> = {
  BCOIN: "/icons/token.png",
  SEN: "/icons/sen_token.png",
};

/** Top staking wallets ranking. */
const RankingStakeWallets: React.FC = () => {
  const { network } = useAccount();
  const history = useHistory();
  const location = useLocation();

  // Filters start from the URL so ranking links are shareable
  const init = useMemo(() => new URLSearchParams(location.search), []);

  const [token, setToken] = useState<StakeToken>(init.get("token") === "sen" ? "SEN" : "BCOIN");
  const [consolidated, setConsolidated] = useState(init.get("all") === "1");
  const [page, setPage] = useState(parseInt(init.get("page") ?? "", 10) || 1);
  const [data, setData] = useState<WalletStakeRankingResponse | null>(null);
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
    if (consolidated) query.set("all", "1");
    if (page > 1) query.set("page", String(page));
    const search = query.toString();
    history.replace(location.pathname + (search ? "?" + search : ""));
  }, [token, consolidated, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWalletStakeRanking(network, { token, consolidated, page, size: PAGE_SIZE })
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
  }, [network, token, consolidated, page]);

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
            { label: "Wallets", value: summary.wallets },
            { label: "Biggest stake", value: formatAmount(summary.biggest_stake), icon: TOKEN_ICON[token] },
            { label: "Avg per wallet", value: formatAmount(summary.avg_stake), icon: TOKEN_ICON[token] },
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
          <div className="empty">No staking wallets found</div>
        )}
        {!loading && data && data.items.length > 0 && (
          <div className="list">
            {data.items.map((row) => (
              <WalletRow key={row.wallet}>
                <div className="rank">#{row.rank}</div>
                <Link
                  className="wallet"
                  to={"/explorer/wallet/" + row.wallet + (consolidated ? "?all=1" : "")}
                  title={row.wallet}
                >
                  {row.wallet}
                </Link>
                <div className="col">
                  <div className="title">HEROES STAKED</div>
                  <span>
                    {row.heroes_staked} / {row.heroes}
                  </span>
                </div>
                <div className="col">
                  <div className="title">BCOIN</div>
                  <div className="amount">
                    <img src="/icons/token.png" alt="" />
                    <span>{numberFormat(row.stake_bcoin, 0)}</span>
                  </div>
                </div>
                <div className="col">
                  <div className="title">SEN</div>
                  <div className="amount">
                    <img src="/icons/sen_token.png" alt="" />
                    <span>{numberFormat(row.stake_sen, 0)}</span>
                  </div>
                </div>
              </WalletRow>
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

const WalletRow = styled.div`
  display: flex;
  align-items: center;
  padding: 1.125rem 1.313rem;
  border: solid 1px #343849;
  background-color: #191b24;

  .rank {
    width: 4.5rem;
    font-family: "agency-fb-regular", sans-serif;
    font-size: 2rem;
    color: #ff973a;
  }

  .wallet {
    flex: 1;
    font-size: 1.25rem;
    color: #fff;
    text-decoration: none;
    word-break: break-all;
    &:hover {
      color: #ff973a;
      text-decoration: underline;
    }
  }

  .col {
    width: 13rem;
    .title {
      font-size: 0.813rem;
      color: #a6afd7;
      margin-bottom: 0.5rem;
    }
    span {
      font-size: 1.375rem;
      font-weight: 500;
      color: #fff;
    }
    .amount {
      display: flex;
      align-items: center;
      img {
        width: 1.75rem;
        height: 1.75rem;
        object-fit: contain;
        margin-right: 0.5rem;
      }
    }
  }
`;

export default RankingStakeWallets;
