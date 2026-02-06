import React, { ChangeEvent } from "react";
import styled from "styled-components";
import SearchIcon from "../icons/search";

const BoxSearch = styled.div`
  padding-right: 1rem;
  background: #3a3f54;
  margin: 0px 6px;
  transition: background 0.3s ease-in-out;
  border-radius: 2px;
  display: flex;
  align-items: center;
  padding: 0rem 1rem;
  svg {
    width: 2rem;
    height: 2rem;
    fill: white;
  }

  input {
    height: 2.625rem;
    padding: 0 0px 0px 1.625rem;
    background: #3a3f54;
    border: none;
    width: 7rem;
    color: white;
    transition: background 0.3s ease-in-out;
    &:focus {
      outline: none;
    }
  }
  &:hover {
    background: #131e4b;
    input {
      background: #131e4b;
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
      <input onChange={onChangeSearch} placeholder="#" />
    </BoxSearch>
  );
};

export default Search;
