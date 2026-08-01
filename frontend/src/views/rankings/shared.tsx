import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { numberFormat } from "../../utils/helper";
import { StakeToken } from "../../utils/explorer/api";

/** Sub-navigation shared by the ranking pages. */
export const RankingTabs: React.FC = () => (
  <TabTitle>
    <TabLink activeClassName="active" to="/rankings/stake">
      <img src="/icons/bhero.webp" alt="" />
      Stake Heroes
    </TabLink>
    <TabLink activeClassName="active" to="/rankings/stake-wallets">
      <img src="/icons/token.png" alt="" />
      Stake Wallets
    </TabLink>
  </TabTitle>
);

interface TokenSelectProps {
  value: StakeToken;
  onChange: (token: StakeToken) => void;
}

export const TokenSelect: React.FC<TokenSelectProps> = ({ value, onChange }) => (
  <SelectWrap>
    <select value={value} onChange={(e) => onChange(e.target.value as StakeToken)}>
      <option value="BCOIN">BCOIN</option>
      <option value="SEN">SEN</option>
    </select>
  </SelectWrap>
);

export interface SummaryItem {
  label: string;
  value: string | number;
  icon?: string;
}

export const SummaryCards: React.FC<{ items: SummaryItem[] }> = ({ items }) => (
  <Cards>
    {items.map((item) => (
      <div className="card" key={item.label}>
        <div className="label">{item.label}</div>
        <div className="value">
          {item.icon && <img src={item.icon} alt="" />}
          <span>{item.value}</span>
        </div>
      </div>
    ))}
  </Cards>
);

export const formatAmount = (value: number): string | number => numberFormat(value, 0);

export const TabTitle = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
  border-bottom: 1px solid #3f445b;
`;

export const TabLink = styled(NavLink)`
  padding: 1rem 1.875rem;
  font-size: 2rem;
  color: #fff;
  display: flex;
  align-items: center;
  opacity: 0.3;
  cursor: pointer;
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

export const HeaderOptions = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  padding-right: 1.5rem;
  gap: 0.5rem;
`;

export const SelectWrap = styled.div`
  padding-right: 1rem;
  background: #3a3f54;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
  border-radius: 2px;
  select {
    height: 2.625rem;
    padding: 0 1.625rem;
    background: #3a3f54;
    border: none;
    color: white;
    transition: background 0.3s ease-in-out;
    cursor: pointer;
    &:focus {
      outline: none;
    }
  }
  &:hover {
    background: #131e4b;
    select {
      background: #131e4b;
    }
  }
`;

const Cards = styled.div`
  display: flex;
  gap: 1.25rem;
  padding: 1.688rem 1.25rem 0;

  .card {
    flex: 1;
    border: solid 1px #343849;
    background-color: #191b24;
    padding: 1.25rem 1.5rem;

    .label {
      font-size: 0.875rem;
      color: #a6afd7;
      text-transform: uppercase;
      margin-bottom: 0.625rem;
    }

    .value {
      display: flex;
      align-items: center;
      img {
        width: 1.75rem;
        height: 1.75rem;
        object-fit: contain;
        margin-right: 0.5rem;
      }
      span {
        font-family: "agency-fb-regular", sans-serif;
        font-size: 2.125rem;
        color: #fff;
      }
    }
  }
`;

export const RankingContent = styled.div`
  padding: 1.688rem 1.25rem;

  .list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty {
    color: #a6afd7;
    font-size: 1.25rem;
    padding: 3rem 0;
    text-align: center;
  }

  .loading-in-local > div {
    min-height: 30rem;
  }
`;

export const WrapPagination = styled.div`
  padding: 3rem 0;
  display: flex;
  justify-content: center;
`;

export const Page = styled.div`
  width: 100%;
`;
