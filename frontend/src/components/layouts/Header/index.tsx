import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { ContainerFull } from "../../common/style";
import ConnectWallet from "../../buttons/ConnectWallet";
import logo from "../../../assets/images/logo.png";

const HeaderComp: React.FC = () => {
  return (
    <Header>
      <ContainerFull>
        <Logo src={logo} alt="" />
        <div className="menu">
          <NavLink
            exact
            to="/"
            className="link agency"
            activeClassName="active"
          >
            <img src="/images/rectangle.png" alt="" /> Dashboard
          </NavLink>
          <NavLink
            to="/market"
            className="link agency"
            activeClassName="active"
          >
            <img src="/images/rectangle-5.png" alt="" /> Market
          </NavLink>
        </div>
        <SpaceRight>
          <ConnectWallet />
        </SpaceRight>
      </ContainerFull>
    </Header>
  );
};

const Header = styled.div`
  width: 100%;
  min-width: 62.5rem;
  height: 3.188rem;
  background-color: #11131b;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 10000;
  .menu {
    margin-left: 40px;
    display: flex;
  }
  .link {
    font-size: 1.531rem;
    color: #fff;
    padding: 0px 20px;
    display: flex;
    align-items: center;
    height: 3.188rem;
    transition: background 0.3s ease-in-out;
    &:hover {
      /* opacity: 0.9; */
      background-color: #242735;
    }
    img {
      margin-right: 1rem;
      width: 1.688rem;
      height: 1.688rem;
    }
    &.active {
      background-color: #242735;
    }
  }
`;

const Logo = styled.img`
  margin-left: 1rem;
  height: 3.75rem;
  object-fit: contain;
`;

const SpaceRight = styled.div`
  margin-left: auto;
  display: flex;
  justify-content: flex-end;
`;

export default HeaderComp;
