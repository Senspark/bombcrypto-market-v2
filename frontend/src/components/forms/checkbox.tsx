import React, { useState, ChangeEvent } from "react";
import styled from "styled-components";

const GroupCheckBox = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  & > div {
    flex: 0 0 48%;
  }
`;

const CheckBox = styled.div`
  margin-bottom: 0.8rem;
  &.mr-left {
    /* margin-right: 1px; */
  }
  input {
    display: none;
  }
  .box {
    width: 1.5rem;
    height: 1.5rem;
    flex: 0 0 1.5rem;
    background: var(--surface-2, #3a3f54);
    border: 1.5px solid var(--border-strong, #3f4564);
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    position: relative;
    transition: background 0.15s ease, border-color 0.15s ease;
    &:after {
      content: "";
      position: absolute;
      top: 45%;
      left: 50%;
      width: 0.32rem;
      height: 0.62rem;
      transform: translate(-50%, -55%) rotate(45deg);
      border: solid #fff;
      border-width: 0 2.5px 2.5px 0;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
  }
  &:hover .box {
    border-color: var(--accent, #ff973a);
  }
  input:checked + label {
    .box {
      background: var(--accent, #ff973a);
      border-color: var(--accent, #ff973a);
      &:after {
        opacity: 1;
      }
    }
  }
  label {
    display: flex;
    align-items: center;
    color: white;
    font-size: 1.05rem;
    cursor: pointer;
    .content {
      margin-left: 0.6rem;
      white-space: nowrap;
    }
  }
`;

interface CheckboxOption {
  value: string | number;
  label: string;
}

interface CheckboxProps {
  init?: string | number | (string | number)[];
  options: CheckboxOption[];
  name: string;
  onChange?: (name: string, value: (string | number)[]) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ init, options, name, onChange = () => {} }) => {
  const convertInit = Array.isArray(init) ? init : init ? [init] : [];
  const [value, setValue] = useState<(string | number)[]>(
    convertInit.map((element) => parseInt(String(element)))
  );

  const changeCheckBox = (event: ChangeEvent<HTMLInputElement>) => {
    const option = event.target.value;
    const temp = [...value];
    // value may hold numbers (seeded from the URL via parseInt) while `option`
    // is always a string, so compare with String() on both sides — otherwise
    // unchecking a URL-seeded box never matches and it can't be removed.
    const index = value.findIndex((element) => String(element) === String(option));
    if (index === -1) {
      temp.push(option);
    } else {
      temp.splice(index, 1);
    }
    setValue(temp);
    onChange(name, temp);
  };

  return (
    <GroupCheckBox>
      {options.map((element, index) => {
        const findIndex = value.findIndex((item) => String(item) === String(element.value));
        const checked = findIndex >= 0;

        return (
          <CheckBox
            key={element.value}
            className={index % 2 === 0 ? "mr-left" : "mr-right"}
          >
            <input
              type="checkbox"
              id={String(element.value)}
              name="packpage"
              onChange={changeCheckBox}
              value={element.value}
              checked={checked}
            />
            <label htmlFor={String(element.value)}>
              <div className="box" />
              <div className="content">{element.label}</div>
            </label>
          </CheckBox>
        );
      })}
    </GroupCheckBox>
  );
};

export default Checkbox;
