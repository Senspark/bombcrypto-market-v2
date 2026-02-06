import React, { ChangeEvent } from "react";
import styled from "styled-components";

const FormItem = styled.div`
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  label {
    font-size: 1.156rem;
    font-weight: normal;
    font-stretch: normal;
    font-style: normal;
    line-height: 1.35;
    letter-spacing: normal;
    text-align: left;
    color: ${({ theme }) => theme.colors.text};
    min-width: 7rem;
    display: inline-block;
  }
  span {
    color: ${({ theme }) => theme.colors.text};
    margin-right: 1rem;
  }
  & > div {
  }
  input {
    width: 3.125rem;
    height: 1.688rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
    border: solid 1px ${({ theme }) => theme.colors.border};
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    text-align: center;

    &:focus {
      outline: none;
      box-shadow: none;
      border: 1px solid ${({ theme }) => theme.colors.primary};
    }
  }
`;

interface FieldProps {
  init?: string;
  label: string;
  name: string;
  onChange?: (name: string, value: string) => void;
}

const Field: React.FC<FieldProps> = ({ init = "", label, name, onChange = () => {} }) => {
  const changeInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onChange(name, value);
  };
  return (
    <FormItem>
      <label htmlFor="">{label}</label>
      <div>
        <span>{">="}</span>
        <input type="text" defaultValue={init} onChange={changeInput} aria-label={label} />
      </div>
    </FormItem>
  );
};

export default Field;
