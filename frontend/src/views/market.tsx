import React, { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import { List } from "../components/icons/index";
import Slider from "../components/forms/range";
import GroupCheckBox from "../components/forms/checkbox";
import GroupCheckBoxToken from "../components/forms/checkboxToken";
import Field from "../components/forms/field";
import FieldPrice from "../components/forms/fieldPrice";
import Ability from "../components/forms/ability";
import BeHeroCard from "../components/list/market-bhero";
import { NavLink, useHistory, useLocation } from "react-router-dom";
import {
  debounce,
  convertFilter,
  convertQueryToObject,
  getAPI,
  axiosGetWithRetry,
} from "../utils/helper";
import { withNetworkParam } from "../utils/config";
import Pagination from "../components/layouts/Pagination";
import Search from "../components/forms/search";
import Loading from "../components/layouts/loading";
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
  tokenId: number;
  abilitiesHeroS?: number[];
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
  //const [dataShield, setDataShield] = useState([]);
  const [preHeroS, setPreHeroS] = useState<number[]>([]);
  const payload = useRef<ParamsState>();

  const options = [
    { label: "Common", value: 0 },
    { label: "Rare", value: 1 },
    { label: "Super Rare", value: 2 },
    { label: "Epic", value: 3 },
    { label: "Legend", value: 4 },
    { label: "SP Legend", value: 5 },
    { label: "Mega", value: 6 },
    { label: "Super Mega", value: 7 },
    { label: "Mystic", value: 8 },
    { label: "Super Mystic", value: 9 },
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
    history.replace(withNetworkParam(location.pathname + "?" + result, network));
    try {
      const listing = await axiosGetWithRetry(
        getAPI(network) + "transactions/heroes/search?status=listing&" + result
      );
      const { page, size, totalCount, totalPages, transactions } =
        listing.data;
      const dataHeroS: number[] = [];
      transactions?.map((el: ListItem) => {
        const isHeroS =
          !_.isEmpty(el?.abilitiesHeroS) &&
          !_.includes(el?.abilitiesHeroS, 0);
        if (isHeroS) {
          return dataHeroS.push(el?.tokenId);
        }
      });

      const data = await getListTokenPay(listing);
      setPreHeroS(dataHeroS);
      setData((data as ListItem[]) || []);
      setParams((state) => ({
        ...state,
        page: page,
        total_count: totalCount,
        total_pages: totalPages,
        size,
      }));
    } catch (error) {}

    if (timmer) clearTimeout(timmer);
    timmer = setTimeout(() => {
      fetch(params);
    }, 60000);
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
    if (preHeroS.length !== 0) {
      // FIXME: nhanc18 check sau
      // fetchShieldData(preHeroS);
    }
  }, [preHeroS.length && preHeroS[0]]);

  // const fetchShieldData = async (data) => {
  //   const resp = await axios.post("https://api-test.bombcrypto.io/shield", {
  //     headers: {
  //       "Access-Control-Allow-Origin": true,
  //       accept: "application/json",
  //     },
  //     ids: data,
  //   });
  //   if (resp.data?.message) {
  //     setDataShield(resp.data?.message);
  //   } else {
  //     setDataShield([]);
  //   }
  //   return resp;
  // };
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
            <select
              name=""
              id=""
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
          <div className="title">Hero Type</div>
          <div className="select" style={{ width: "50%" }}>
            <Select
              name="s_ability"
              onChange={onChange}
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
            onChange={onChange}
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
                onChange={onChange}
              />
            </div>
          </div>

          <Field
            label="Power"
            name="bomb_power"
            init={params.bomb_power}
            onChange={onChange}
          />
          <Field
            label="Speed"
            name="speed"
            init={params.speed}
            onChange={onChange}
          />
          <Field
            label="Stamina"
            name="stamina"
            init={params.stamina}
            onChange={onChange}
          />
          <Field
            label="Bomb num"
            name="bomb_count"
            init={params.bomb_count}
            onChange={onChange}
          />
          <Field
            label="Range"
            name="bomb_range"
            init={params.bomb_range}
            onChange={onChange}
          />

          <div className="title">Ability</div>
          <Ability init={params.ability as unknown as number[]} onChange={onChange} name="ability" />
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

          {data && (
            <BeHeroCard
              data={data as any}
              view={view as "list" | "card"}
              network={network}
            />
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
  font-family: "Sora", sans-serif;
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

  @media (max-width: 820px) {
    padding: 0.7rem 1.1rem;
    font-size: 1.4rem;
    img {
      height: 1.5rem;
      margin-right: 0.5rem;
    }
  }
`;

const Option = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  padding-right: 1.5rem;
  @media (max-width: 820px) {
    margin-left: 0;
    width: 100%;
    padding: 0.6rem 0.75rem;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
  .select {
    margin: 0px 6px;
    select {
      height: 2.5rem;
      padding: 0 2.2rem 0 0.9rem;
      color: #fff;
      cursor: pointer;
      background-color: var(--surface-2, #3a3f54);
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238d95b7' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.7rem center;
      background-size: 0.75rem;
      border: 1px solid var(--border, #2c3146);
      border-radius: var(--radius-sm, 6px);
      appearance: none;
      -webkit-appearance: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      &:hover {
        border-color: var(--border-strong, #3a4060);
      }
      &:focus {
        outline: none;
        border-color: var(--accent, #ff973a);
        box-shadow: 0 0 0 2px rgba(255, 151, 58, 0.2);
      }
    }
  }

  .item {
    border-radius: var(--radius-sm, 6px);
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2, #3a3f54);
    border: 1px solid var(--border, #2c3146);
    margin: 0px 6px;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
    svg {
      fill: white;
    }
    &:hover,
    &.active {
      border-color: var(--accent, #ff973a);
      background: var(--surface, #131e4b);
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
    height: calc(115vh);
    border-right: 1px solid #3f445b;
    padding: 2rem 1.375rem;
    position: sticky;
    top: 0;
    @media (max-width: 1440px) {
      flex: 0 0 23rem;
      width: 23rem;
    }
    .title {
      color: var(--text-muted, #9ca5b4);
      margin: 1.25rem 0 0.55rem;
      font-size: 1.02rem;
      font-weight: 600;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      font-family: "Sora", sans-serif;
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
    min-width: 0;
    .right-title {
      font-family: "Sora", sans-serif;
      font-size: 2.031rem;
      color: #fff;
      margin-bottom: 1.563rem;
    }
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    .left {
      flex: 1 1 auto;
      width: 100%;
      height: auto;
      position: static;
      border-right: none;
      border-bottom: 1px solid var(--border, #3f445b);
    }
    .right {
      width: 100%;
    }
  }
`;

const TabTitle = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;
  border-bottom: 1px solid #3f445b;
  @media (max-width: 820px) {
    flex-wrap: wrap;
    overflow: visible;
  }
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
