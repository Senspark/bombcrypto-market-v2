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
          {comp.map((element) => (
            <div
              className={view === element.value ? "item active" : "item"}
              key={element.value}
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
