import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Container } from "../common/style";
import BHeroFullWidth from "../cards/dashboard-bhero";
import Bhouse from "../cards/dashboard-bhouse";
import Loading from "../layouts/loading";
import { debounce, convertFilter } from "../../utils/helper";
import { useAccount } from "../../context/account";
import axios from "axios";
import useGetTokenPayList from "../../hooks/useGetTokenPayList";
import { getAPI } from "../../utils/helper";

interface Tab {
  label: string;
  value: string;
  icon: string;
}

const tabs: Tab[] = [
  {
    label: "BHero",
    value: "heroes",
    icon: "/icons/bhero.webp",
  },
  {
    label: "BHouse",
    value: "houses",
    icon: "/icons/bhouse.webp",
  },
];

interface ListingProps {
  emit?: (fn: (name: string, value: unknown) => void) => void;
}

interface ListItem {
  id?: string | number;
  token_id?: string | number;
  rarity?: number;
  level?: number;
  bomb_power?: number;
  speed?: number;
  stamina?: number;
  bomb_count?: number;
  bomb_range?: number;
  abilities?: number[];
  abilities_hero_s?: number[];
  amount?: string | number | bigint;
  isToken?: string;
  skin?: number;
  color?: number;
  seller_wallet_address?: string;
  capacity?: number;
  [key: string]: unknown;
}

const Listing: React.FC<ListingProps> = ({ emit = () => {} }) => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isFetch, setIsFetch] = useState(false);
  const [list, setList] = useState<ListItem[] | null>(null);
  const { getListTokenPay } = useGetTokenPayList();
  const { updateClear, network } = useAccount();
  const mountedRef = useRef(true);
  const timmerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const changeTab = (index: number) => {
    return () => {
      if (loading || index === tab) return;
      let isGetBHouse: boolean;
      if (index === 1) {
        isGetBHouse = true;
        setIsFetch(true);
      } else {
        isGetBHouse = false;
        setIsFetch(false);
      }
      setTab(index);
      setList(null);
      if (timmerRef.current) clearTimeout(timmerRef.current);
      fetchLoading(params, index, isGetBHouse);
    };
  };

  const params: Record<string, unknown> = { size: 10 };
  const onChange = debounce((name: string, value: unknown) => {
    params[name] = value;
    fetchLoading(params, tab);
  }, 1000);

  emit(onChange);

  const fetch = async (params: Record<string, unknown>) => {
    if (!mountedRef.current) return;
    setLoading(true);
    const name = tabs[tab].value;
    const query = convertFilter(params);

    const listing = await axios.get(
      getAPI(network) +
        "transactions/" +
        name +
        "/search?status=listing&" +
        query
    );

    if (!mountedRef.current) return;
    const data = await getListTokenPay(listing, isFetch);
    if (!mountedRef.current) return;
    setList((data as ListItem[]) || []);
    if (timmerRef.current) clearTimeout(timmerRef.current);
    timmerRef.current = setTimeout(() => {
      fetch(params);
    }, 60000);
    setLoading(false);
  };

  const fetchLoading = async (
    params: Record<string, unknown>,
    index: number,
    isGetBHouse?: boolean
  ) => {
    if (!mountedRef.current) return;
    setLoading(true);
    const query = convertFilter(params);
    const name = tabs[index].value;
    const listing = await axios.get(
      getAPI(network) +
        "transactions/" +
        name +
        "/search?status=listing&" +
        query
    );
    if (!mountedRef.current) return;
    const data = await getListTokenPay(listing, isGetBHouse);
    if (!mountedRef.current) return;
    setList((data as ListItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchLoading(params, tab);
    timmerRef.current = setTimeout(() => {
      fetch(params);
    }, 60000);
    return () => {
      mountedRef.current = false;
      if (timmerRef.current) clearTimeout(timmerRef.current);
    };
  }, [network]);

  useEffect(() => {
    updateClear(() => {
      fetch(params);
    });
  }, []);

  const Child = tab === 0 ? BHeroFullWidth : Bhouse;

  useEffect(() => {});
  return (
    <Container>
      <Recently>
        <TabTitle>
          {tabs.map((element, index) => (
            <Element
              className={index === tab ? "active" : ""}
              onClick={changeTab(index)}
              key={index}
            >
              <img src={element.icon} alt="" />
              {element.label}
            </Element>
          ))}
        </TabTitle>
        <ContentTab>
          {list === null && (
            <div className="loading">
              <Loading />
            </div>
          )}
          {list &&
            list.map((element) => <Child key={element.id || element.token_id} data={element as any} />)}
        </ContentTab>
      </Recently>
    </Container>
  );
};

const Element = styled.div`
  padding: 1.375rem 1.875rem;
  font-size: 2rem;
  color: #fff;
  display: flex;
  align-items: center;
  opacity: 0.3;
  cursor: pointer;
  transition: opacity 0.3s ease-in-out;

  img {
    width: 1.688rem;
    height: 2.125rem;
    margin-right: 1rem;
    object-fit: contain;
  }

  &.active {
    opacity: 1;
  }
`;

const ContentTab = styled.div`
  width: 100%;
  border-top: none;
  position: relative;
  .loading {
    position: absolute;
    top: 220px;
  }
`;

const TabTitle = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;
`;

const Recently = styled.div`
  border: solid 2px #343849;
  width: 100%;
  margin-bottom: 1rem;
`;

export default React.memo(Listing);
