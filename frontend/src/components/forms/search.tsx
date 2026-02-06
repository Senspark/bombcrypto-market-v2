import React, { ChangeEvent } from "react";
import styled from "styled-components";
import SearchIcon from "../icons/search";

const BoxSearch = styled.div`
  padding-right: 1rem;
  background: ${({ theme }) => theme.colors.surfaceLighter};
  margin: 0px 6px;
  transition: background 0.3s ease-in-out;
  border-radius: 2px;
  display: flex;
  align-items: center;
  padding: 0rem 1rem;
  svg {
    width: 2rem;
    height: 2rem;
    fill: ${({ theme }) => theme.colors.text};
  }

  input {
    height: 2.625rem;
    padding: 0 0px 0px 1.625rem;
    background: ${({ theme }) => theme.colors.surfaceLighter};
    border: none;
    width: 7rem;
    color: ${({ theme }) => theme.colors.text};
    transition: background 0.3s ease-in-out;
    &:focus {
      outline: none;
    }
  }
  &:hover {
    background: ${({ theme }) => theme.colors.background};
    input {
      background: ${({ theme }) => theme.colors.background};
    }
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
      <input onChange={onChangeSearch} placeholder="#" aria-label="Search by ID" />
    </BoxSearch>
  );
};

export default Search;
