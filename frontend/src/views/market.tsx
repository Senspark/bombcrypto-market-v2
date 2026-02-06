import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import styled from "styled-components";
import { List } from "../components/icons/index";
import Chart from "../components/icons/chart";
import PulseDashboard from "../components/dashboard/PulseDashboard";
import Slider from "../components/forms/range";
import GroupCheckBox from "../components/forms/checkbox";
import GroupCheckBoxToken from "../components/forms/checkboxToken";
import Field from "../components/forms/field";
import FieldPrice from "../components/forms/fieldPrice";
import Ability from "../components/forms/ability";
import BeHeroCard from "../components/list/market-bhero";
import { NavLink, useHistory, useLocation } from "react-router-dom";
import {
  convertFilter,
  convertQueryToObject,
  getAPI,
} from "../utils/helper";
import Pagination from "../components/layouts/Pagination";
import Search from "../components/forms/search";
import Loading from "../components/layouts/loading";
import axios from "axios";
import { useAccount } from "../context/account";
import Select from "../components/forms/select";
import _ from "lodash";
import useGetTokenPayList from "../hooks/useGetTokenPayList";

interface Tab {
  label: string;
  value: string;
  icon: string;
  to: string;
}

const tabs: Tab[] = [
  {
    label: "BHero",
    value: "bHero",
    icon: "/icons/bhero.webp",
    to: "/market/bhero",
  },
  {
    label: "BHouse",
    value: "behero",
    icon: "/icons/bhouse.webp",
    to: "/market/bhouse",
  },
];

interface ViewComp {
  value: string;
  icon: React.ReactNode;
}

const comp: ViewComp[] = [
  {
    value: "list",
    icon: <List />,
  },
  {
    value: "pulse",
    icon: <Chart />,
  },
];

let timmer: ReturnType<typeof setTimeout> | null = null;
let unount = false;

interface SortOption {
  label: string;
  value: string;
}

const sortby: SortOption[] = [
  { label: "Latest", value: "desc:block_timestamp" },
  { label: "High price", value: "desc:amount" },
  { label: "Low price", value: "asc:amount" },
  { label: "High stats", value: "high_stats" },
  { label: "Rarity", value: "desc:rarity" },
];

interface ParamsState {
  page: number;
  size: number;
  order_by: string;
  total_count?: number;
  total_pages?: number;
  token_id?: string;
  pay_token?: string;
  amount?: string;
  s_ability?: string;
  rarity?: string;
  level?: string;
  bomb_power?: string;
  speed?: string;
  stamina?: string;
  bomb_count?: string;
  bomb_range?: string;
  ability?: string;
  [key: string]: unknown;
}

interface ListItem {
  id: string;
  token_id: number;
  abilities_hero_s?: number[];
  [key: string]: unknown;
}

const Statistics: React.FC = () => {
  const { updateClear, network } = useAccount();
  const location = useLocation();
  const history = useHistory();
  const { getListTokenPay } = useGetTokenPayList();

  const init = useMemo(() => {
    const defaultQuery = convertQueryToObject(location.search);
    const init: ParamsState = {
      page: 1,
      size: 10,
      order_by: sortby[0]?.value || "",
      ...defaultQuery,
    };
    return init;
  }, []);

  const [params, setParams] = useState<ParamsState>(init);
  const [view, setView] = useState("list");
  const [data, setData] = useState<ListItem[] | null>(null);
  const [preHeroS, setPreHeroS] = useState<number[]>([]);
  const payload = useRef<ParamsState>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchRef = useRef<(params: ParamsState) => Promise<void>>();

  const options = [
    { label: "Common", value: 0 },
    { label: "Rare", value: 1 },
    { label: "Super Rare", value: 2 },
    { label: "Epic", value: 3 },
    { label: "Legend", value: 4 },
    { label: "SP Legend", value: 5 },
  ];

  const optionsToken = [
    { id: 10, label: "BCOIN", icon: "/icons/token.png", value: "BCOIN" },
    { id: 11, label: "SEN", icon: "/icons/sen_token.png", value: "SEN" },
  ];

  const optionsPrice = [
    { id: 0, label: "Min", key: "gte" },
    { id: 1, label: "Max", key: "lte" },
  ];

  const handleParamChange = useCallback((name: string, value: unknown) => {
    setParams((prev) => {
      if (_.isEqual(prev[name], value)) return prev;

      const next = { ...prev, [name]: value };

      if (name === "token_id") {
        next.page = 1;
      }

      payload.current = next;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const delay = name === "token_id" ? 500 : 100;

      timerRef.current = setTimeout(() => {
        if (fetchRef.current) {
          fetchRef.current(next);
        }
      }, delay);

      return next;
    });
  }, []);

  const fetch = async (params: ParamsState) => {
    if (unount) return;
    const result = convertFilter(params);
    history.replace(location.pathname + "?" + result);
    try {
      const listing = await axios.get(
        getAPI(network) + "transactions/heroes/search?status=listing&" + result
      );
      const { page, size, total_count, total_pages, transactions } =
        listing.data;
      const dataHeroS: number[] = [];
      transactions?.map((el: ListItem) => {
        const isHeroS =
          !_.isEmpty(el?.abilities_hero_s) &&
          !_.includes(el?.abilities_hero_s, 0);
        if (isHeroS) {
          return dataHeroS.push(el?.token_id);
        }
      });

      const data = await getListTokenPay(listing);
      setPreHeroS(dataHeroS);
      setData((data as ListItem[]) || []);
      setParams((state) => ({
        ...state,
        page: page,
        total_count,
        total_pages,
        size,
      }));
    } catch (error) {
      console.error(error);
      if (data === null) {
        setData([]);
      }
    }

    if (timmer) clearTimeout(timmer);
    timmer = setTimeout(() => {
      fetch(params);
    }, 60000);
  };

  useEffect(() => {
    fetchRef.current = fetch;
  }, [fetch]);

  const onChangeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    handleParamChange("order_by", value);
  };

  const change = (name: string, value: unknown) => {
    if (params[name] === value) return;
    setData(null);
    params[name] = value;
    payload.current = params;
    fetch(params);
  };

  useEffect(() => {
    unount = false;
    fetch(params);
    return () => {
      unount = true;
      if (timmer) clearTimeout(timmer);
    };
  }, [network]);

  updateClear(() => {
    fetch(params);
  });
  return (
    <Recently>
      <TabTitle>
        {tabs.map((element) => (
          <Element activeClassName="active" key={element.label} to={element.to}>
            <img src={element.icon} alt={element.label + " Icon"} />
            {element.label}
          </Element>
        ))}
        <Option>
          <Search onChange={handleParamChange} name="token_id" aria-label="Search Token ID" />
          <div className="select">
            <select
              name="order_by"
              id="order_by_select"
              aria-label="Sort by"
              onChange={onChangeSelect}
              defaultChecked={sortby[0] as unknown as boolean}
            >
              {sortby.map((element) => (
                <option value={element.value} key={element.value}>
                  {element.label}
                </option>
              ))}
            </select>
          </div>
          {comp.map((element) => (
            <div
              className={view === element.value ? "item active" : "item"}
              key={element.value}
              role="button"
              tabIndex={0}
              aria-label={`Switch to ${element.value} view`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setView(element.value);
                }
              }}
              onClick={() => {
                setView(element.value);
              }}
            >
              {element.icon}
            </div>
          ))}
        </Option>
      </TabTitle>
      <ContentTab>
        <div className="left custom-form">
          <div className="title">Token</div>
          <GroupCheckBoxToken
            options={optionsToken}
            name="pay_token"
            init={params.pay_token}
            onChange={handleParamChange}
          />
          <div className="title">Price</div>
          <FieldPrice
            options={optionsPrice}
            name="amount"
            init={params.amount}
            onChange={handleParamChange}
          />
          <div className="title">Hero Type</div>
          <div className="select" style={{ width: "50%" }}>
            <Select
              name="s_ability"
              onChange={handleParamChange}
              defaultValue={params.s_ability}
              options={[
                { value: "", label: "All" },
                { value: "0", label: "Normal" },
                { value: "1", label: "S Hero" },
              ]}
            />
          </div>
          <div className="title">Rarity</div>
          <GroupCheckBox
            options={options}
            name="rarity"
            init={params.rarity}
            onChange={handleParamChange}
          />

          <div className="title">Stats</div>
          <div className="level">
            <span>Level</span>
            <div>
              <Slider
                min={1}
                max={5}
                name="level"
                init={params.level as unknown as string[]}
                onChange={handleParamChange}
              />
            </div>
          </div>

          <Field
            label="Power"
            name="bomb_power"
            init={params.bomb_power}
            onChange={handleParamChange}
          />
          <Field
            label="Speed"
            name="speed"
            init={params.speed}
            onChange={handleParamChange}
          />
          <Field
            label="Stamina"
            name="stamina"
            init={params.stamina}
            onChange={handleParamChange}
          />
          <Field
            label="Bomb num"
            name="bomb_count"
            init={params.bomb_count}
            onChange={handleParamChange}
          />
          <Field
            label="Range"
            name="bomb_range"
            init={params.bomb_range}
            onChange={handleParamChange}
          />

          <div className="title">Ability</div>
          <Ability init={params.ability as unknown as number[]} onChange={handleParamChange} name="ability" />
        </div>
        <div className="right">
          {params.total_count !== 0 && (
            <div className="right-title">{params.total_count} Bheroes</div>
          )}
          {data === null && (
            <div className="loading-in-local">
              <Loading />
            </div>
          )}

          {data && view === "pulse" ? (
            <PulseDashboard data={data} totalCount={params.total_count} />
          ) : (
            data && (
              <BeHeroCard
                data={data as any}
                view={view as "list" | "card"}
                network={network}
              />
            )
          )}
          <WrapPagination>
            <Pagination
              onChange={change}
              page={params.page}
              name="page"
              total_page={params.total_pages}
            />
          </WrapPagination>
        </div>
      </ContentTab>
    </Recently>
  );
};

const Element = styled(NavLink)`
  padding: 1rem 1.875rem;
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  opacity: 0.3;
  cursor: pointer;
  transition: opacity 0.3s ease-in-out;
  font-family: ${({ theme }) => theme.fonts.primary};
  transition: 0.3s ease-in-out;
  &:hover {
    color: ${({ theme }) => theme.colors.text} !important;
    opacity: 1;
  }

  img {
    height: 2.125rem;
    margin-right: 1rem;
  }

  &.active {
    opacity: 1;
    position: relative;
    &:before {
      content: "";
      display: block;
      width: 100%;
      height: 0.375rem;
      background-color: ${({ theme }) => theme.colors.primary};
      position: absolute;
      bottom: 0;
      left: 0;
    }
  }
`;

const Option = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  padding-right: 1.5rem;
  .select {
    padding-right: 1rem;
    background: ${({ theme }) => theme.colors.surfaceLighter};
    margin: 0px 6px;
    cursor: pointer;
    transition: background 0.3s ease-in-out;
    border-radius: 2px;
    select {
      height: 2.625rem;
      padding: 0 1.625rem;
      background: ${({ theme }) => theme.colors.surfaceLighter};
      border: none;
      color: ${({ theme }) => theme.colors.text};
      transition: background 0.3s ease-in-out;
      &:focus {
        outline: none;
      }
    }
    &:hover {
      background: ${({ theme }) => theme.colors.background};
      select {
        background: ${({ theme }) => theme.colors.background};
      }
    }
  }

  .item {
    border-radius: 2px;
    width: 2.625rem;
    height: 2.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.colors.surfaceLighter};
    margin: 0px 6px;
    cursor: pointer;
    transition: background 0.3s ease-in-out;
    svg {
      fill: ${({ theme }) => theme.colors.text};
    }
    &:hover,
    &.active {
      background: ${({ theme }) => theme.colors.background};
    }
    &:focus {
       outline: 2px solid ${({ theme }) => theme.colors.primary};
    }
  }
`;

const ContentTab = styled.div`
  width: 100%;
  border-top: none;
  display: flex;
  flex-direction: column;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: row;
  }

  .loading-in-local {
    & > div {
      min-height: 65.438rem;
    }
  }

  .left {
    width: 100%; // Mobile first
    padding: 2rem 1.375rem;
    position: relative;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};

    @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
      flex: 0 0 23rem;
      width: 23rem;
      height: calc(115vh);
      border-right: 1px solid ${({ theme }) => theme.colors.border};
      border-bottom: none;
      position: sticky;
      top: 0;
    }

    .title {
      color: ${({ theme }) => theme.colors.secondary};
      margin: 1.063rem 0rem;
      font-size: 1.594rem;
      font-family: ${({ theme }) => theme.fonts.primary};
    }
    .level {
      display: flex;
      & > span {
        margin-right: 1rem;
        font-size: 1rem;
        color: ${({ theme }) => theme.colors.text};
        transform: translateY(-10px);
      }
      & > div {
        width: 100%;
      }
    }
  }
  .right {
    padding: 1.688rem 1.25rem;
    flex: 1;
    .right-title {
      font-family: ${({ theme }) => theme.fonts.primary};
      font-size: 2.031rem;
      color: ${({ theme }) => theme.colors.text};
      margin-bottom: 1.563rem;
    }
  }
`;

const TabTitle = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-wrap: wrap; // Allow wrapping on small screens
`;

const Recently = styled.div`
  width: 100%;
`;

const WrapPagination = styled.div`
  padding: 5.438rem 0rem;
  display: flex;
  justify-content: center;
`;
export default Statistics;
