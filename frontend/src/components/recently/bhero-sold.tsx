import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Container } from "../common/style";
import BHeroFullWidth from "../cards/dashboard-bhero-sold";
import Bhouse from "../cards/dashboard-bhouse-sold";
import Pagination from "../layouts/Pagination";
import Loading from "../layouts/loading";
import { convertFilter, getAPI } from "../../utils/helper";
import axios from "axios";
import { useAccount } from "../../context/account";
import useGetTokenPayList from "../../hooks/useGetTokenPayList";

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

let timmer: ReturnType<typeof setTimeout> | null = null;
let unmount = false;

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

interface ParamsState {
  page?: number;
  size: number;
  total_pages?: number;
  [key: string]: unknown;
}

const Listing: React.FC<ListingProps> = ({ emit = () => {} }) => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isFetch, setIsFetch] = useState(false);
  const [list, setList] = useState<ListItem[] | null>(null);
  const { getListTokenPay } = useGetTokenPayList();
  const [params, setParams] = useState<ParamsState>({ size: 10 });
  const { network } = useAccount();
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
      setList(null);
      if (timmer) clearTimeout(timmer);
      setTab(index);
      fetchLoading(params, index, isGetBHouse);
    };
  };

  const onChange = (name: string, value: unknown) => {
    params[name] = value;
    setList(null);
    if (timmer) clearTimeout(timmer);
    fetchLoading(params, tab);
    timmer = setTimeout(() => {
      fetch(params);
    }, 60000);
  };

  emit(onChange);
  const fetch = async (params: ParamsState) => {
    if (unmount) return;
    const params_search = {
      page: params.page,
      size: params.size,
    };
    setLoading(true);
    const name = tabs[tab].value;
    const query = convertFilter(params_search);

    const listing = await axios.get(
      getAPI(network) + "transactions/" + name + "/search?status=sold&" + query
    );
    const data = await getListTokenPay(listing, isFetch);
    setList((data as ListItem[]) || []);
    if (timmer) clearTimeout(timmer);
    timmer = setTimeout(() => {
      fetch(params);
    }, 60000);
    setLoading(false);
  };

  const fetchLoading = async (
    params: ParamsState,
    index: number,
    isGetBHouse?: boolean
  ) => {
    if (unmount) return;
    setLoading(true);
    const params_search = {
      page: params.page,
      size: params.size,
    };
    const query = convertFilter(params_search);
    const name = tabs[index].value;
    const listing = await axios.get(
      getAPI(network) + "transactions/" + name + "/search?status=sold&" + query
    );

    const data = await getListTokenPay(listing, isGetBHouse);
    setParams(listing.data);
    setList((data as ListItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    unmount = false;
    fetchLoading(params, tab);
    if (timmer) clearTimeout(timmer);
    timmer = setTimeout(() => {
      fetch(params);
    }, 60000);
    return () => {
      // timmer = true;
      unmount = true;
      if (timmer) clearTimeout(timmer);
    };
  }, [network]);

  const Child = tab === 0 ? BHeroFullWidth : Bhouse;

  return (
    <Container>
      <SubWrap>
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
        <WrapPagination>
          <Pagination
            onChange={onChange}
            page={params.page}
            name="page"
            total_page={params.total_pages}
          />
        </WrapPagination>
      </SubWrap>
    </Container>
  );
};

const WrapPagination = styled.div`
  padding: 2rem 0rem;
  display: flex;
  justify-content: center;
  width: 100%;
`;

const SubWrap = styled.div`
  width: 100%;
`;

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
