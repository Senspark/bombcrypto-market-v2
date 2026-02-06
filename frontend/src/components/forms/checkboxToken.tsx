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
    width: 1.688rem;
    height: 1.688rem;
    background: #3a3f54;
    cursor: pointer;
    position: relative;
    &:after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 75%;
      height: 75%;
      transform: translate(-50%, -50%);
      background: #ff973a;
      opacity: 0;
      border-radius: 3px;
    }
  }
  input:checked + label {
    .box {
      &:after {
        opacity: 1;
      }
    }
  }
  label {
    display: flex;
    color: white;
    font-size: 1.188rem;
    .content {
      margin-left: 0.75rem;
      white-space: nowrap;
    }
  }
`;

const Icon = styled.img`
  width: 1.5rem;
  height: 1.5rem;
  margin-right: 5px;
`;

interface CheckboxTokenOption {
  value: string;
  label: string;
  icon: string;
}

interface CheckboxTokenProps {
  init?: string | string[];
  options: CheckboxTokenOption[];
  name: string;
  onChange?: (name: string, value: string[]) => void;
}

const CheckboxToken: React.FC<CheckboxTokenProps> = ({ init, options, name, onChange = () => {} }) => {
  const convertInit = Array.isArray(init) ? init : init ? [init] : [];
  const [value, setValue] = useState<string[]>(
    convertInit.map((element) => element)
  );

  const changeCheckBox = (event: ChangeEvent<HTMLInputElement>) => {
    const option = event.target.value;
    const temp = [...value];
    const index = value.findIndex((element) => element === option);
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
        const findIndex = value.findIndex(
          (item) => String(item) === String(element.value)
        );
        const checked = findIndex >= 0;

        return (
          <CheckBox
            key={element.value}
            className={index % 2 === 0 ? "mr-left" : "mr-right"}
          >
            <input
              type="checkbox"
              id={element.value}
              name="packpage"
              onChange={changeCheckBox}
              value={element.value}
              checked={checked}
            />
            <label htmlFor={element.value}>
              <div className="box" />
              <div className="content" style={{ display: "flex" }}>
                <Icon src={element.icon} />
                {element.label}
              </div>
            </label>
          </CheckBox>
        );
      })}
    </GroupCheckBox>
  );
};

export default CheckboxToken;
