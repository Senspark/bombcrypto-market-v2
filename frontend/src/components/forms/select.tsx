import React, { ChangeEvent } from "react";
import styled from "styled-components";

const BoxSelect = styled.div`
  .select {
    padding-right: 1rem;
    background: #3a3f54;
    margin: 0px 6px;
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
  }
`;

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  name: string;
  options: SelectOption[];
  defaultValue?: string | number;
  onChange?: (name: string, value: string) => void;
}

const Select: React.FC<SelectProps> = ({ name, onChange = () => {}, options, defaultValue }) => {
  const onChangeSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onChange(name, value);
  };

  return (
    <BoxSelect>
      <div className="select">
        <select name="" id="" onChange={onChangeSelect} defaultValue={defaultValue}>
          {options.map((element) => (
            <option value={element.value} key={element.value}>
              {element.label}
            </option>
          ))}
        </select>
      </div>
    </BoxSelect>
  );
};

export default Select;
