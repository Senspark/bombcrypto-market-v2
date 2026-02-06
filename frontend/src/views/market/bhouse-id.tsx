import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useHistory, useParams } from "react-router-dom";
import Loading from "../../components/layouts/loading";
import axios from "axios";
import Button from "../../components/buttons/buy";
import { About, Stats } from "../../components/detail/house";
import { Tag, CardItem } from "../../components/common/style";
import { AiOutlineLeft } from "react-icons/ai";
import { bcoinFormat, mapHouse, mapTag } from "../../utils/helper";
import useGetTokenPayList from "../../hooks/useGetTokenPayList";
import { IMAGE_TOKEN_SHOW } from "../../utils/config";
import { useAccount } from "../../context/account";
import { getAPI } from "../../utils/helper";
import {
  onListenNetworkChange,
  offListenNetworkChange,
} from "../../components/Service/web3";

interface RouteParams {
  id: string;
}

interface HouseData {
  token_id: number;
  rarity: number;
  amount: string;
  isToken?: string;
  [key: string]: unknown;
}

const MarketHeroById: React.FC = () => {
  const { auth, network } = useAccount();
  const { getListTokenPay } = useGetTokenPayList();
  const [data, setData] = useState<HouseData | null>(null);
  const params = useParams<RouteParams>();
  const history = useHistory();
  const [isFirstRun, setIsFirstRun] = useState(true);

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

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    const listing = await axios.get(
      getAPI(network) +
        "transactions/houses/search?status=listing&token_id=" +
        params.id
    );
    const data = (await getListTokenPay(listing, true)) as HouseData[];
    if (data.length > 0) {
      setData(data[0]);
    }
  };

  const changeNetorkListener = () => {
    goBack();
  };

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
                    {mapHouse[data.rarity]}
                  </Tag>
                </div>
                <div className="icon-hero">
                  <img
                    src={
                      "/house/" +
                      mapHouse[data.rarity].replace(" ", "") +
                      ".png"
                    }
                    alt=""
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
              <Stats data={data as any} />
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
