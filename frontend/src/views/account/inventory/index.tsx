import React, { useState } from "react";
import {
  useRouteMatch,
  NavLink,
  Switch,
  Route,
  Redirect,
  useLocation,
} from "react-router-dom";

import Select from "../../../components/forms/select";
import styled from "styled-components";
import Bhouse from "./house";
import Bhero from "./hero";
import AnimationLoad from "../../../components/common/animation";

interface SortOption {
  label: string;
  value: string;
}

const sortby: SortOption[] = [
  { label: "All", value: "all" },
  { label: "Selling", value: "selling" },
  { label: "No Selling", value: "no-selling" },
  { label: "Rarity", value: "rarity" },
  { label: "S Hero", value: "s-hero" },
  // { label: "High price", value: "hight" },
  // { label: "Low price", value: "low" },
];

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
    to: "/account/inventory/bhero",
  },
  {
    label: "BHouse",
    value: "behero",
    icon: "/icons/bhouse.webp",
    to: "/account/inventory/bhouse",
  },
];

interface ParamsState {
  page: number;
  size: number;
  filter: string;
  [key: string]: unknown;
}

const Account: React.FC = () => {
  const [params, setParams] = useState<ParamsState>({
    page: 1,
    size: 10,
    filter: "all",
  });
  const { path } = useRouteMatch();
  const onChange = (name: string, value: unknown) => {
    const temp = { ...params };
    if (name === "filter") params.page = 1;
    temp[name] = value;
    setParams(temp);
  };
  const location = useLocation();
  return (
    <AccountStyled>
      <div className="wrap-link">
        {tabs.map((element, index) => (
          <Element key={index} to={element.to} activeClassName="active">
            <img src={element.icon} alt="" />
            {element.label}
          </Element>
        ))}
        <div className="select">
          <Select options={sortby} name="filter" onChange={onChange} />
        </div>
      </div>
      <Switch location={location} key={location.pathname}>
        <Route exact path={`${path}`}>
          <Redirect to={`${path}/bhero`} />
        </Route>

        <Route exact path={`${path}/bhouse`}>
          <AnimationLoad>
            <Bhouse onChange={onChange} params={params} />
          </AnimationLoad>
        </Route>
        <Route exact path={`${path}/bhero`}>
          <AnimationLoad>
            <Bhero onChange={onChange} params={params} />
          </AnimationLoad>
        </Route>
      </Switch>
    </AccountStyled>
  );
};

const AccountStyled = styled.div`
  width: 100%;
  padding: 1.688rem 0;
  .wrap-link {
    display: flex;
    border-bottom: 1px solid #3f445b;
    align-items: center;
  }
  .select {
    margin-left: auto;
    margin-right: 1rem;
  }
`;

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

export default Account;
