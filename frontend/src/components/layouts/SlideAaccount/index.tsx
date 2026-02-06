import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { useAccount } from "../../../context/account";
import { Logout } from "../../icons";

const SlideAccount: React.FC = () => {
  const { logout } = useAccount();
  return (
    <Slide>
      <div>
        <NavLink
          exact
          to="/account"
          className="link agency"
          activeClassName="active"
        >
          <img src="/icons/account.webp" alt="" /> Account
        </NavLink>
        <NavLink
          to="/account/inventory"
          className="link agency"
          activeClassName="active"
        >
          <img src="/images/rectangle-5.png" alt="" /> Inventory
        </NavLink>
      </div>
      <div className="logout" onClick={logout}>
        <div className="btn">
          <Logout />
          <span>Logout</span>
        </div>
      </div>
    </Slide>
  );
};

const Slide = styled.div`
  width: 100%;
  /* position: sticky; */
  padding-right: 1.25rem;

  .menu {
    margin-left: 40px;
    display: flex;
  }
  .logout {
    width: 100%;
    border-top: 1px solid #3f445b;
    color: white;
    position: absolute;
    bottom: 1rem;
    font-size: 1.5rem;
    font-weight: bold;
    cursor: pointer;
    padding: 0.5rem 2rem;
    .btn {
      color: red;
      display: flex;
      align-items: center;
      svg {
        margin-right: 0.5rem;
        width: 1.4rem;
        height: 1.4rem;
        fill: red;
      }
    }
  }

  .link {
    font-size: 1.531rem;
    color: #fff;
    padding: 0.688rem 1.625rem;
    display: flex;
    align-items: center;
    height: 3.188rem;
    transition: background 0.3s ease-in-out;
    &:hover,
    &.active {
      background-color: #373b4d;
    }
    img {
      margin-right: 1rem;
      width: 1.688rem;
      height: 1.688rem;
    }
  }
`;

export default SlideAccount;
