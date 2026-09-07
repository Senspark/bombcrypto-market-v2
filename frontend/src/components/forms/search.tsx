import React, { ChangeEvent } from "react";
import styled from "styled-components";
import SearchIcon from "../icons/search";

const BoxSearch = styled.div`
  background: var(--surface-2, #3a3f54);
  border: 1px solid var(--border, #2c3146);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  border-radius: var(--radius-sm, 6px);
  display: flex;
  align-items: center;
  padding: 0rem 0.9rem;
  svg {
    width: 1.5rem;
    height: 1.5rem;
    fill: var(--text-muted, #8d95b7);
  }

  input {
    height: 2.5rem;
    padding: 0 0 0 0.6rem;
    background: transparent;
    border: none;
    width: 7rem;
    color: #fff;
    &::placeholder {
      color: var(--text-muted, #8d95b7);
    }
    &:focus {
      outline: none;
    }
  }
  &:focus-within {
    border-color: var(--accent, #ff973a);
    box-shadow: 0 0 0 2px rgba(255, 151, 58, 0.2);
  }
`;

interface SearchProps {
  name: string;
  onChange?: (name: string, value: string) => void;
}

const Search: React.FC<SearchProps> = ({ name, onChange = () => {} }) => {
  const onChangeSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onChange(name, value);
  };

  return (
    <BoxSearch>
      <SearchIcon />
      <input onChange={onChangeSearch} placeholder="#" />
    </BoxSearch>
  );
};

export default Search;
