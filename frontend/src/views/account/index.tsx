import React from "react";
import { useRouteMatch, Switch, Route } from "react-router-dom";
import LeftSlide from "../../components/layouts/SlideAaccount";
import styled from "styled-components";
import Wallet from "./wallet";
import Inventory from "./inventory";
import AnimationLoad from "../../components/common/animation";

const Account: React.FC = () => {
  const { path } = useRouteMatch();
  return (
    <AccountStyled>
      <div className="left custom-form">
        <LeftSlide />
      </div>
      <Switch>
        <Route exact path={path}>
          <AnimationLoad>
            <Wallet />
          </AnimationLoad>
        </Route>
        <Route path={`${path}/inventory`}>
          <Inventory />
        </Route>
      </Switch>
    </AccountStyled>
  );
};

const AccountStyled = styled.div`
  display: flex;
  .left {
    flex: 0 0 18rem;
    width: 18rem;
    height: calc(100vh - 2.813rem);
    border-right: 1px solid #3f445b;
    padding: 2rem 0;
    position: sticky;
    top: 3.188rem;
    .title {
      color: #7680ab;
      margin: 1.063rem 0rem;
      font-size: 1.594rem;
      font-family: "agency-fb-regular", sans-serif;
    }
  }
`;

export default Account;
