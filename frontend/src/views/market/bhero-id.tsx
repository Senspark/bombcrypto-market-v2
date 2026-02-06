import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useHistory, useParams } from "react-router-dom";
import Loading from "../../components/layouts/loading";
import axios from "axios";
import Button from "../../components/buttons/buy";
import { Skill, About, Stats } from "../../components/detail/hero";
import { Tag, CardItem } from "../../components/common/style";
import { AiOutlineLeft } from "react-icons/ai";

import { bcoinFormat, mapRarity, mapTag, getAPI } from "../../utils/helper";
import { HeroIcon } from "../../components/hero";
import { IMAGE_TOKEN_SHOW, HeroType } from "../../utils/config";
import useGetTokenPayList from "../../hooks/useGetTokenPayList";
import { useAccount } from "../../context/account";
import {
  onListenNetworkChange,
  offListenNetworkChange,
} from "../../components/Service/web3";
import _ from "lodash";
import { getShieldData } from "../../components/Service/api";

interface RouteParams {
  id: string;
}

interface HeroData {
  token_id: number;
  rarity: number;
  level: number;
  amount: string;
  isToken?: string;
  abilities_hero_s?: number[];
  [key: string]: unknown;
}

interface ShieldData {
  heroType?: string;
  [key: string]: unknown;
}

const MarketHeroById: React.FC = () => {
  const [data, setData] = useState<HeroData | null>(null);
  const params = useParams<RouteParams>();
  const history = useHistory();
  const { getListTokenPay } = useGetTokenPayList();
  const { auth, network } = useAccount();
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [shieldData, setShieldData] = useState<ShieldData | null>(null);
  const [isHeroS, setIsHeroS] = useState(false);

  useEffect(() => {
    (async function () {
      const listing = await axios.get(
        getAPI(network) +
          "transactions/heroes/search?status=listing&token_id=" +
          params.id
      );
      const resp = await getListTokenPay(listing);
      const data = resp as HeroData[];
      if (data.length > 0) {
        const dt = data[0];
        setData(dt);

        const heroS =
          !_.isEmpty(dt?.abilities_hero_s) &&
          !_.includes(dt?.abilities_hero_s, 0);
        setIsHeroS(heroS);

        const resp = await getShieldData(dt?.token_id, network);
        setShieldData(resp as ShieldData | null);
      }
    })();
  }, [params]);

  const goBack = () => {
    const pathname = window.location.href;
    let type = "";
    if (pathname.includes("hero")) type = "bhero";
    if (pathname.includes("house")) type = "bhouse";
    if (!type) return;
    if (pathname.includes("market")) {
      history.push("/market/" + type);
      return;
    }
    if (pathname.includes("inventory")) {
      history.push("/inventory/" + type);
      return;
    }
  };

  const changeNetorkListener = () => {
    goBack();
  };

  useEffect(() => {
    if (auth?.logged) {
      onListenNetworkChange(changeNetorkListener);
      return () => {
        offListenNetworkChange(changeNetorkListener);
      };
    }
  }, []);

  useEffect(() => {
    if (!auth?.logged && !isFirstRun) {
      changeNetorkListener();
    }

    if (isFirstRun) {
      setIsFirstRun(false);
    }
  }, [network]);

  return (
    <Recently>
      {!data && (
        <div className="loading-in-local">
          <Loading />
        </div>
      )}
      {data && (
        <ContentTab>
          <Back>
            <div onClick={goBack}>
              <AiOutlineLeft /> Back
            </div>
          </Back>
          <Content>
            <div>
              <CardItem>
                <div className="header">
                  <Tag>#{data.token_id}</Tag>
                  <Tag className={mapTag[data.rarity]}>
                    {mapRarity(data.rarity)}
                  </Tag>
                </div>

                <div className="icon-hero">
                  <div className="level">Level {data.level}</div>
                  <HeroIcon
                    data={data as any}
                    heroType={isHeroS ? HeroType.s : (shieldData?.heroType as any)}
                    iconStyle={{ width: "1.875rem", height: "3rem" }}
                  />
                </div>
                <div className="footer action">
                  <img
                    src={IMAGE_TOKEN_SHOW[data?.isToken || ""] || "/icons/token.png"}
                    alt=""
                    style={{ width: "2rem", height: "2rem" }}
                  />
                  <b>{bcoinFormat(data.amount)} </b>
                  <div className="toolip">{bcoinFormat(data.amount)}</div>
                </div>
                <div className="buy-wrap">
                  <Button
                    data={data}
                    price={data.amount}
                    id={params.id}
                    fetchData={() => {}}
                  />
                </div>
              </CardItem>
            </div>
            <Right>
              <About data={data as any} />
              <Stats data={data as any} network={network} />
              <Skill data={data as any} />
            </Right>
          </Content>
        </ContentTab>
      )}
    </Recently>
  );
};

const Recently = styled.div`
  width: 100%;
  border-top: none;
  display: flex;
  .loading-in-local {
    width: 100%;
    & > div {
      min-height: 90vh;
    }
  }
`;

const Content = styled.div`
  max-width: 75rem;
  min-width: 62.5rem;
  margin: 0 auto;
  display: flex;
`;

const Right = styled.div`
  width: 100%;
  margin-bottom: 2rem;
  margin-left: 7rem;
`;

const Back = styled.div`
  max-width: 75rem;
  min-width: 62.5rem;
  margin: 10px auto;
  cursor: pointer;
  transition: 0.3s ease-in-out;
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
  div {
    display: flex;
    align-items: center;
    font-size: 1.1rem;
    color: white;
    display: fit-content;

    font-weight: 500;
    svg {
      width: 1rem;
      height: 1rem;
      fill: white;
      margin-right: 0.5rem;
    }
  }
`;

const ContentTab = styled.div`
  margin-top: 5rem;
  width: 100%;
  border-top: none;
  .loading-in-local {
    & > div {
      min-height: 65.438rem;
    }
  }
`;

export default MarketHeroById;
