import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Container } from "../../common/style";
import { bcoinFormat } from "../../../utils/helper";
import axios from "axios";
import Tooltip from "antd/es/tooltip";
import { Row, Col } from "antd";
import { useAccount } from "../../../context/account";
import { getAPI } from "../../../utils/helper";

interface TabItem {
  label: string;
  value: string;
}

interface TabHeroItem {
  label: string;
  value: string;
  icon: string;
  to: string;
}

interface StatisticsData {
  count_listing?: number;
  volume_sen?: number | string;
  volume_bcoin?: number | string;
  count_sold?: number;
}

interface StatsResponse {
  one_day?: StatisticsData;
  seven_days?: StatisticsData;
  thirty_days?: StatisticsData;
  [key: string]: StatisticsData | undefined;
}

const tabsHero: TabHeroItem[] = [
  {
    label: "BHero",
    value: "bHero",
    icon: "/icons/bhero.webp",
    to: "/market/bhero",
  },
  {
    label: "BHouse",
    value: "bHouse",
    icon: "/icons/bhouse.webp",
    to: "/market/bhouse",
  },
];

const tabs: TabItem[] = [
  {
    label: "Last 24h",
    value: "one_day",
  },
  {
    label: "7 days",
    value: "seven_days",
  },
  {
    label: "30 days",
    value: "thirty_days",
  },
];

const Statistics: React.FC = () => {
  const [data, setData] = useState<StatsResponse>({});
  const [tab, setTab] = useState<string>("one_day");
  const [tabinc, setTabinc] = useState<string>("bHero");
  const { network } = useAccount();
  const changeTab = (value: string) => {
    return () => {
      setTab(value);
    };
  };
  const changeTabinc = (value: string) => {
    return () => {
      setTabinc(value);
      loadStats(value, network);
    };
  };

  const loadStats = async (tabinc: string, network: string) => {
    let baseUrl = getAPI(network);
    if (tabinc === "bHero") {
      const result = await axios.get<StatsResponse>(`${baseUrl}transactions/heroes/stats`);
      setData(result.data || {});
    } else {
      const result = await axios.get<StatsResponse>(`${baseUrl}transactions/houses/stats`);
      setData(result.data || {});
    }
  };

  const statistics: StatisticsData = data[tab] || {};
  useEffect(() => {
    loadStats(tabinc, network);
  }, [network]);
  return (
    <Container>
      <ContainerTab>
        <TabTitle>
          {tabs.map((element) => (
            <Element
              key={element.value}
              className={element.value === tab ? "active" : ""}
              onClick={changeTab(element.value)}
            >
              {element.label}
            </Element>
          ))}

          <div className="right">
            {tabsHero.map((element) => (
              <TabChange
                key={element.value}
                className={element.value === tabinc ? "active" : ""}
                onClick={changeTabinc(element.value)}
              >
                <img src={element.icon} alt="" />
                {element.label}
              </TabChange>
            ))}
          </div>
        </TabTitle>
        <ContentTab>
          <Row className="row" justify="center" wrap={false} gutter={10}>
            <Col md={6} xs={6} sm={6}>
              <Row wrap={false} gutter={10}>
                <Col md={7} xs={12} sm={10}>
                  <img className="icon" src="/icons/Volume.png" alt="" />
                </Col>
                <Col md={17} xs={12} sm={14}>
                  <Row>
                    <div className="title">TOTAL SALE</div>
                  </Row>
                  <Row>
                    <div className="value">
                      <Tooltip
                        title={bcoinFormat(statistics.count_listing)}
                        placement="top"
                        overlayInnerStyle={{
                          color: "black",
                          backgroundColor: "white",
                          fontWeight: "bold",
                          opacity: "1",
                          fontSize: "18px",
                        }}
                      >
                        <div className="ellipsis">
                          {Math.ceil(bcoinFormat(statistics.count_listing))}
                        </div>
                      </Tooltip>
                    </div>
                  </Row>
                </Col>
              </Row>
            </Col>
            <Col md={6} xs={6} sm={6}>
              <Row wrap={false} gutter={10}>
                <Col md={5} xs={9} sm={7}>
                  <img className="icon" src="/icons/sen_token.png" alt="" />
                </Col>
                <Col md={19} xs={15} sm={17}>
                  <Row wrap={true}>
                    <div className="title">TOTAL VOLUME</div>
                  </Row>
                  <Row>
                    <div className="value">
                      <Tooltip
                        title={bcoinFormat(statistics.volume_sen)}
                        placement="top"
                        overlayInnerStyle={{
                          color: "black",
                          backgroundColor: "white",
                          fontWeight: "bold",
                          opacity: "1",
                          fontSize: "18px",
                        }}
                      >
                        <div className="ellipsis">
                          {Math.ceil(bcoinFormat(statistics.volume_sen))}
                        </div>
                      </Tooltip>
                    </div>
                  </Row>
                </Col>
              </Row>
            </Col>
            <Col md={6} xs={6} sm={6}>
              <Row wrap={false} gutter={10}>
                <Col md={5} xs={9} sm={7}>
                  <img className="icon" src="/icons/token.png" alt="" />
                </Col>
                <Col md={19} xs={15} sm={17}>
                  <Row wrap={true}>
                    <div className="title">TOTAL VOLUME</div>
                  </Row>
                  <Row>
                    <div className="value">
                      <Tooltip
                        title={bcoinFormat(statistics.volume_bcoin)}
                        placement="top"
                        overlayInnerStyle={{
                          color: "black",
                          backgroundColor: "white",
                          fontWeight: "bold",
                          opacity: "1",
                          fontSize: "18px",
                        }}
                      >
                        <div className="ellipsis">
                          {Math.ceil(bcoinFormat(statistics.volume_bcoin))}
                        </div>
                      </Tooltip>
                    </div>
                  </Row>
                </Col>
              </Row>
            </Col>
            <Col md={3} xs={5} sm={5}>
              {tabinc === "bHero" && (
                <Row wrap={false} gutter={10}>
                  <Col md={8} xs={9} sm={7}>
                    <img className="icon" src="/icons/hero-icon.png" alt="" />
                  </Col>
                  <Col md={16} xs={15} sm={17}>
                    <Row wrap={true}>
                      <div className="title">BHERO SOLD</div>
                    </Row>
                    <Row>
                      <div className="value">
                        <Tooltip
                          title={bcoinFormat(statistics.count_sold)}
                          placement="top"
                          overlayInnerStyle={{
                            color: "black",
                            backgroundColor: "white",
                            fontWeight: "bold",
                            opacity: "1",
                            fontSize: "18px",
                          }}
                        >
                          <div className="ellipsis">
                            {Math.ceil(bcoinFormat(statistics.count_sold))}
                          </div>
                        </Tooltip>
                      </div>
                    </Row>
                  </Col>
                </Row>
              )}
              {tabinc === "bHouse" && (
                <Row wrap={false} gutter={10}>
                  <Col md={12} xs={9} sm={9}>
                    <img className="icon" src="/icons/bhouse.webp" alt="" />
                  </Col>
                  <Col md={14} xs={15} sm={15}>
                    <Row wrap={true}>
                      <div className="title">BHOUSE SOLD</div>
                    </Row>
                    <Row>
                      <div className="value">
                        <Tooltip
                          title={bcoinFormat(statistics.count_sold)}
                          placement="top"
                          overlayInnerStyle={{
                            color: "black",
                            backgroundColor: "white",
                            fontWeight: "bold",
                            opacity: "1",
                            fontSize: "18px",
                          }}
                        >
                          <div className="ellipsis">
                            {Math.ceil(bcoinFormat(statistics.count_sold))}
                          </div>
                        </Tooltip>
                      </div>
                    </Row>
                  </Col>
                </Row>
              )}
            </Col>
          </Row>
        </ContentTab>
      </ContainerTab>
    </Container>
  );
};

const TabChange = styled.div`
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

const Element = styled.div`
  padding: 1.5rem 2.75rem;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.33;
  letter-spacing: normal;
  text-align: center;
  color: #fff;
  font-size: 1.5rem;
  position: relative;
  cursor: pointer;
  &::after {
    display: block;
    content: "";
    position: absolute;
    width: 100%;
    left: 100%;
    height: 6px;
    bottom: 0;
    left: 0;
    background-color: #ff973a;
    transform: translateY(100%);
    transition: transform 0.3s ease-in-out;
  }

  &.active {
    &::after {
      transform: translateY(0);
    }
  }
`;

const ContainerTab = styled.div`
  width: 100%;
  margin-top: 4.75rem;
`;
const ContentTab = styled.div`
  width: 100%;
  border: solid 2px #343849;
  border-top: none;
  display: flex;
  justify-content: space-around;
  margin-bottom: 3.438rem;
  padding: 2.188rem 0rem;
  .icon {
    height: 4rem;
  }
  .title {
    font-size: 1rem;
    font-weight: normal;
    line-height: 1.32;
    color: #fff;
    white-space: nowrap;
  }
  .value {
    font-size: 2rem;
    color: #fff;
    overflow: hidden;
  }
  .row {
    width: 95%;
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const TabTitle = styled.div`
  display: flex;
  border: solid 2px #343849;
  width: 100%;
  overflow: hidden;
  align-items: center;
  .right {
    margin-left: auto;
    display: flex;
  }
`;
export default Statistics;
