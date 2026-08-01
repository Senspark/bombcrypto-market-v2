import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { TabLink, TabTitle } from "../rankings/shared";

/** Sub-navigation shared by the explorer pages. */
export const ExplorerTabs: React.FC = () => (
  <TabTitle>
    <TabLink activeClassName="active" to="/explorer/wallet">
      <img src="/icons/token.png" alt="" />
      Wallet
    </TabLink>
    <TabLink activeClassName="active" to="/explorer/hero">
      <img src="/icons/bhero.webp" alt="" />
      Hero
    </TabLink>
    <TabLink activeClassName="active" to="/explorer/house">
      <img src="/icons/bhouse.webp" alt="" />
      House
    </TabLink>
  </TabTitle>
);

interface ExplorerSearchProps {
  placeholder: string;
  /** Value from the URL, shown when the page loads with a target. */
  initial?: string;
  onSearch: (value: string) => void;
}

export const ExplorerSearch: React.FC<ExplorerSearchProps> = ({ placeholder, initial, onSearch }) => {
  const [value, setValue] = useState(initial ?? "");

  // Navigating between two detail pages keeps this component mounted, so the
  // box has to follow the target in the URL
  useEffect(() => {
    setValue(initial ?? "");
  }, [initial]);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <SearchWrap>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <button onClick={submit}>Search</button>
    </SearchWrap>
  );
};

const SearchWrap = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1.688rem 1.25rem 0;

  input {
    flex: 1;
    max-width: 40rem;
    height: 3rem;
    padding: 0 1rem;
    border-radius: 0.313rem;
    border: solid 0.125rem #373c51;
    background-color: #191b24;
    color: #fff;
    font-size: 1.125rem;
    &:focus {
      outline: none;
      box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px, rgb(51, 51, 51) 0px 0px 0px 3px;
    }
    &::placeholder {
      color: #5a628a;
    }
  }

  button {
    padding: 0 2.125rem;
    border-radius: 3px;
    font-size: 1.125rem;
    color: #381a09;
    cursor: pointer;
    font-weight: 500;
    background-color: #ff973a;
    border: none;
    &:hover {
      filter: brightness(1.1);
    }
  }
`;

export const ExplorerHint = styled.div`
  color: #a6afd7;
  font-size: 1.25rem;
  padding: 4rem 1.25rem;
  text-align: center;
`;

export const ExplorerContent = styled.div`
  padding: 1.688rem 1.25rem;

  .section-title {
    font-family: "agency-fb-regular", sans-serif;
    font-size: 2.031rem;
    color: #fff;
    margin: 1.5rem 0 1rem;

    .staked-filter {
      margin-left: 1.5rem;
      font-family: sans-serif;
      font-size: 1rem;
      color: #a6afd7;
      cursor: pointer;
      input {
        margin-right: 0.5rem;
        accent-color: #ff973a;
      }
    }
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty {
    color: #a6afd7;
    font-size: 1.25rem;
    padding: 2rem 0;
  }

  .loading-in-local > div {
    min-height: 20rem;
  }
`;
