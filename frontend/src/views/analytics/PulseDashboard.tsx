import React from 'react';
import styled from 'styled-components';
import { NavLink, Route, Switch, Redirect, useLocation } from "react-router-dom";
import PulseBHeroDashboard from "./PulseBHeroDashboard";
import PulseBHouseDashboard from "./PulseBHouseDashboard";

// Pulse Dashboard Wrapper: Handles Tabs Navigation
const PulseDashboard: React.FC = () => {
  const location = useLocation();

  return (
    <DashboardContainer>
      <TabTitle>
        <Element activeClassName="active" to="/pulse/bhero">
          <img src="/icons/bhero.webp" alt="BHero" />
          BHero
        </Element>
        <Element activeClassName="active" to="/pulse/bhouse">
          <img src="/icons/bhouse.webp" alt="BHouse" />
          BHouse
        </Element>
      </TabTitle>

      <Switch location={location} key={location.pathname}>
        <Route exact path="/pulse">
          <Redirect to="/pulse/bhero" />
        </Route>
        <Route exact path="/pulse/bhero">
           <PulseBHeroDashboard />
        </Route>
        <Route exact path="/pulse/bhouse">
           <PulseBHouseDashboard />
        </Route>
      </Switch>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  width: 100%;
  min-height: calc(100vh - 80px);
  background: transparent;
`;

const TabTitle = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;
  border-bottom: 1px solid #3f445b;
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

export default PulseDashboard;
