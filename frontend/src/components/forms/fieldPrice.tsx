import React, { useState, ChangeEvent } from "react";
import styled from "styled-components";

const Form = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  & > div {
    flex: 0 0 48%;
  }
`;

const FormItem = styled.div`
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
    min-width: 2.5rem;
  }
  span {
    color: ${({ theme }) => theme.colors.text};
    margin-right: 1rem;
  }
  & > div {
  }
  input {
    width: 5rem;
    height: 2.5rem;
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

interface FieldPriceOption {
  key: string;
  label: string;
}

interface FieldPriceProps {
  init?: string | string[];
  options: FieldPriceOption[];
  name: string;
  onChange?: (name: string, value: string[]) => void;
}

const FieldPrice: React.FC<FieldPriceProps> = ({ init, options, name, onChange = () => {} }) => {
  const convertInit = Array.isArray(init) ? init : init ? [init] : [];
  const [value, setValue] = useState<string[]>(convertInit.map((element) => element));
  const [minAmount, setMinAmount] = useState<string | number>("");
  const [maxAmount, setMaxAmount] = useState<string | number>("");
  const max = 1000000;

  const spliceAny = (element: string): string => {
    let str = `${element}`;
    return str.slice(0, 3);
  };

  const changeInput = (key: string) => (event: ChangeEvent<HTMLInputElement>) => {
    let target = event.target.value;
    let text = `${target}`;
    let number = parseInt(target);

    if (text === "." || text === "-") {
      if (key === options[0].key) {
        setMinAmount("");
      } else {
        setMaxAmount("");
      }
      return;
    }

    if (!isNaN(parseFloat(target)) && isFinite(Number(target))) {
      const amount = Math.abs(Math.floor(number));
      if (number >= max) {
        number = max;
      }
      if (key === options[0].key) {
        setMinAmount(amount);
      } else {
        setMaxAmount(amount);
      }
    } else {
      if (key === options[0].key) {
        setMinAmount("");
      } else {
        setMaxAmount("");
      }
    }

    let option: string;
    const temp = [...value];
    if (number >= 0) {
      option = `${key}:${number}000000000000000000`;
      temp.push(option);
    }
    const index = value.findIndex((element) => spliceAny(element) === key);
    if (index !== -1) {
      temp.splice(index, 1);
    }
    setValue(temp);
    onChange(name, temp);
  };

  const getAmount = (index: number): string | number => {
    if (index === 0) {
      return minAmount;
    }
    return maxAmount;
  };

  return (
    <Form>
      {options.map((element, index) => {
        return (
          <FormItem key={index}>
            <label htmlFor="">{element.label}</label>
            <div>
              <input
                type="text"
                value={getAmount(index)}
                onChange={changeInput(element?.key)}
                aria-label={`Price ${element.label}`}
              />
            </div>
          </FormItem>
        );
      })}
    </Form>
  );
};

export default FieldPrice;
