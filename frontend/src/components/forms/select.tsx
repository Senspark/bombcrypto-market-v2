import React, { ChangeEvent } from "react";
import styled from "styled-components";

const BoxSelect = styled.div`
  .select {
    select {
      width: 100%;
      height: 2.5rem;
      padding: 0 2.2rem 0 0.9rem;
      color: #fff;
      cursor: pointer;
      background-color: var(--surface-2, #3a3f54);
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238d95b7' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.7rem center;
      background-size: 0.75rem;
      border: 1px solid var(--border, #2c3146);
      border-radius: var(--radius-sm, 6px);
      appearance: none;
      -webkit-appearance: none;
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
      &:hover {
        border-color: var(--border-strong, #3a4060);
      }
      &:focus {
        outline: none;
        border-color: var(--accent, #ff973a);
        box-shadow: 0 0 0 2px rgba(255, 151, 58, 0.2);
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

const Select: React.FC<SelectProps> = ({
  name,
  onChange = () => {},
  options,
  defaultValue,
}) => {
  const onChangeSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onChange(name, value);
  };

  return (
    <BoxSelect>
      <div className="select">
        <select
          name=""
          id=""
          onChange={onChangeSelect}
          defaultValue={defaultValue}
        >
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
