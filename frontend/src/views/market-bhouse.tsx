import React, { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import GroupCheckBox from "../components/forms/checkbox";
import { List } from "../components/icons/index";
import Chart from "../components/icons/chart";
import PulseDashboard from "../components/dashboard/PulseDashboard";
import { NavLink, useHistory } from "react-router-dom";
import { debounce, convertFilter, convertQueryToObject } from "../utils/helper";
import Pagination from "../components/layouts/Pagination";
import Search from "../components/forms/search";
import Loading from "../components/layouts/loading";
import axios from "axios";
import { useAccount } from "../context/account";
import { getAPI } from "../utils/helper";

import BeHeroHouse from "../components/list/market-bhouse";
import useGetTokenPayList from "../hooks/useGetTokenPayList";
import GroupCheckBoxToken from "../components/forms/checkboxToken";
import FieldPrice from "../components/forms/fieldPrice";

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

let timmer: ReturnType<typeof setTimeout> | null = null;
let unount = false;

interface ParamsState {
  page: number;
  size: number;
  order_by: string;
  total_count?: number;
  total_pages?: number;
  token_id?: string;
  pay_token?: string;
  amount?: string;
  rarity?: string;
  [key: string]: unknown;
}

interface ListItem {
  id: string;
  [key: string]: unknown;
}

const Statistics: React.FC = () => {
  const { updateClear, network } = useAccount();
  const { getListTokenPay } = useGetTokenPayList();
  const history = useHistory();

  const init = useMemo(() => {
    const defaultQuery = convertQueryToObject(history.location.search);
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
  const payload = useRef<ParamsState>();

  const options = [
    { label: "Tiny House", value: 0 },
    { label: "Mini House", value: 1 },
    { label: "Luxury House", value: 2 },
    { label: "PentHouse", value: 3 },
    { label: "Villa", value: 4 },
    { label: "Super Villa", value: 5 },
  ];

  const optionsToken = [
    { id: 10, label: "BCOIN", icon: "/icons/token.png", value: "BCOIN" },
    { id: 11, label: "SEN", icon: "/icons/sen_token.png", value: "SEN" },
  ];

  const optionsPrice = [
    { id: 0, label: "Min", key: "gte" },
    { id: 1, label: "Max", key: "lte" },
  ];

  const onChange = debounce((name: string, value: unknown) => {
    if (params[name] === params.page) return;
    setData(null);
    if (name === "token_id") {
      params.page = 1;
    }
    params[name] = value;
    payload.current = params;
    fetch(params);
  }, 1000);

  const fetch = async (params: ParamsState) => {
    if (unount) return;
    const result = convertFilter(params);
    history.replace(history.location.pathname + "?" + result);
    try {
      const listing = await axios.get(
        getAPI(network) + "transactions/houses/search?status=listing&" + result
      );
      const { page, size, total_count, total_pages } = listing.data;
      const data = await getListTokenPay(listing, true);
      setData((data as unknown as ListItem[]) || []);

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
    }, 5000);
  };

  const onChangeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onChange("order_by", value);
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
            <img src={element.icon} alt="" />
            {element.label}
          </Element>
        ))}
        <Option>
          <Search onChange={onChange} name="token_id" />
          <div className="select">
            <select name="" id="" onChange={onChangeSelect}>
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
            onChange={onChange}
          />
          <div className="title">Price</div>
          <FieldPrice
            options={optionsPrice}
            name="amount"
            init={params.amount}
            onChange={onChange}
          />
          <div className="title">Rarity</div>
          <GroupCheckBox
            init={params.rarity}
            options={options}
            name="rarity"
            onChange={onChange}
          />

          {/*<div className="title">Stats</div>*/}
          {/*<div className="level">*/}
          {/*  <span>Level</span>*/}
          {/*  <div>*/}
          {/*    <Slider min={1} max={5} name="level" onChange={onChange} />*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/*<Field label="Power" name="bomb_power" onChange={onChange} />*/}
          {/*<Field label="Speed" name="speed" onChange={onChange} />*/}
          {/*<Field label="Stamina" name="stamina" onChange={onChange} />*/}
          {/*<Field label="Bomb num" name="bomb_count" onChange={onChange} />*/}
          {/*<Field label="Range" name="range" onChange={onChange} />*/}

          {/*<div className="title">Ability</div>*/}
          {/*<Ability onChange={onChange} name="ability" />*/}
        </div>
        <div className="right">
          {params.total_count !== 0 && (
            <div className="right-title">{params.total_count} Bhouses</div>
          )}
          {data === null && (
            <div className="loading-in-local">
              <Loading />
            </div>
          )}

          {data && view === "pulse" ? (
            <PulseDashboard data={data} totalCount={params.total_count} />
          ) : (
            data && <BeHeroHouse data={data as any} />
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
  color: #fff;
  display: flex;
  align-items: center;
  opacity: 0.3;
  cursor: pointer;
  transition: opacity 0.3s ease-in-out;
  font-family: "agency-fb-regular", sans-serif;
  transition: 0.3s ease-in-out;
  &:hover {
    color: white !important;
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
      background-color: #ff973a;
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
    background: #3a3f54;
    margin: 0px 6px;
    cursor: pointer;
    transition: background 0.3s ease-in-out;
    border-radius: 2px;
    select {
      height: 2.625rem;
      padding: 0 1.625rem;
      background: #3a3f54;
      border: none;
      color: white;
      transition: background 0.3s ease-in-out;
      &:focus {
        outline: none;
      }
    }
    &:hover {
      background: #131e4b;
      select {
        background: #131e4b;
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
    background: #3a3f54;
    margin: 0px 6px;
    cursor: pointer;
    transition: background 0.3s ease-in-out;
    svg {
      fill: white;
    }
    &:hover,
    &.active {
      background: #131e4b;
    }
  }
`;

const ContentTab = styled.div`
  width: 100%;
  border-top: none;
  display: flex;
  .loading-in-local {
    & > div {
      min-height: 65.438rem;
    }
  }

  .left {
    flex: 0 0 23rem;
    width: 23rem;
    height: calc(100vh);
    border-right: 1px solid #3f445b;
    padding: 2rem 1.375rem;
    position: sticky;
    top: 0;
    @media (max-width: 1440px) {
      flex: 0 0 23rem;
      width: 23rem;
    }
    .title {
      color: #7680ab;
      margin: 1.063rem 0rem;
      font-size: 1.594rem;
      font-family: "agency-fb-regular", sans-serif;
    }
    .level {
      display: flex;
      & > span {
        margin-right: 1rem;
        font-size: 1rem;
        color: white;
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
      font-family: "agency-fb-regular", sans-serif;
      font-size: 2.031rem;
      color: #fff;
      margin-bottom: 1.563rem;
    }
  }
`;

const TabTitle = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;
  border-bottom: 1px solid #3f445b;
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
