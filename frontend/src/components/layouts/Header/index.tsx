import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { ContainerFull } from "../../common/style";
import ConnectWallet from "../../buttons/ConnectWallet";
import logo from "../../../assets/images/logo.png";
import { useCart } from "../../../context/cart";
import CartDrawer from "../../cart/CartDrawer";

const HeaderComp: React.FC = () => {
  const { toggleCart, cartItems } = useCart();
  return (
    <Header>
      <ContainerFull>
        <Logo src={logo} alt="Company Logo" />
        <Nav className="menu">
          <NavLink
            exact
            to="/"
            className="link agency"
            activeClassName="active"
            aria-label="Go to Dashboard"
          >
            <img src="/images/rectangle.png" alt="" aria-hidden="true" /> Dashboard
          </NavLink>
          <NavLink
            to="/market"
            className="link agency"
            activeClassName="active"
            aria-label="Go to Market"
          >
            <img src="/images/rectangle-5.png" alt="" aria-hidden="true" /> Market
          </NavLink>
        </Nav>
        <SpaceRight>
          <CartButton onClick={toggleCart}>
             CART <span>{cartItems.length}</span>
          </CartButton>
          <ConnectWallet />
        </SpaceRight>
      </ContainerFull>
      <CartDrawer />
    </Header>
  );
};

const Header = styled.header`
  width: 100%;
  // Removed fixed min-width: 62.5rem for responsiveness
  height: 3.188rem;
  background-color: ${({ theme }) => theme.colors.background};
  position: sticky;
  top: 0;
  left: 0;
  z-index: 10000;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Nav = styled.nav`
  margin-left: ${({ theme }) => theme.spacing.xl};
  display: flex;
  overflow-x: auto; /* Allow horizontal scroll on small screens */

  .link {
    font-size: 1.531rem;
    color: ${({ theme }) => theme.colors.text};
    padding: 0px 20px;
    display: flex;
    align-items: center;
    height: 3.188rem;
    transition: background 0.3s ease-in-out;
    white-space: nowrap;

    &:hover,
    &:focus {
      background-color: ${({ theme }) => theme.colors.surfaceLight};
      outline: none;
    }
    img {
      margin-right: 1rem;
      width: 1.688rem;
      height: 1.688rem;
    }
    &.active {
      background-color: ${({ theme }) => theme.colors.surfaceLight};
      border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: ${({ theme }) => theme.spacing.sm};
    .link {
        font-size: 1.2rem;
        padding: 0 10px;
        img {
            width: 1.2rem;
            height: 1.2rem;
            margin-right: 0.5rem;
        }
    }
  }
`;

const Logo = styled.img`
  margin-left: ${({ theme }) => theme.spacing.md};
  height: 3.75rem;
  object-fit: contain;
`;

const SpaceRight = styled.div`
  margin-left: auto;
  display: flex;
  justify-content: flex-end;
  padding-right: ${({ theme }) => theme.spacing.md};
`;

const CartButton = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 20px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: bold;
  font-size: 1.2rem;

  span {
      background: ${({ theme }) => theme.colors.primary};
      color: #fff;
      border-radius: 12px;
      padding: 0 8px;
      margin-left: 8px;
      font-size: 0.9rem;
  }
`;

export default HeaderComp;
