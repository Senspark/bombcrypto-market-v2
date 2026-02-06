import React, { useState, ChangeEvent } from "react";
import styled from "styled-components";
import { IconItem } from "../common/style";
import { skills, skillsDesc } from "../../utils/helper";
import Tooltip from "antd/es/tooltip";

const Box = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const CheckBox = styled.div`
  margin-bottom: 0.8rem;
  input {
    display: none;
  }

  label {
    margin-right: 0.3rem;
    display: block;
  }

  .content {
    cursor: pointer;
    img {
      filter: grayscale(100%);
    }
  }

  input:checked + label {
    .content img {
      // filter: grayscale(0%);
    }
  }

  .tooltip {
    // position: relative;
    display: inline-block;
    cursor: pointer;
  }
`;

interface AbilityProps {
  init?: number | number[];
  name: string;
  onChange?: (name: string, value: number[]) => void;
}

const Ability: React.FC<AbilityProps> = ({ init, name, onChange = () => {} }) => {
  const convertInit = Array.isArray(init) ? init : init ? [init] : [];
  const [value, setValue] = useState<number[]>(
    convertInit.map((element) => parseInt(String(element)))
  );

  const changeCheckBox = (event: ChangeEvent<HTMLInputElement>) => {
    const option = event.target.value;
    const temp = [...value];
    const index = value.findIndex((element) => element === parseInt(option));
    if (index === -1) {
      temp.push(parseInt(option));
    } else {
      temp.splice(index, 1);
    }
    setValue(temp);
    onChange(name, temp);
  };

  const options = [1, 2, 3, 4, 5, 6, 7];

  const tooltipStyle = {
    color: "#7680ab",
    backgroundColor: "white",
    fontWeight: "bold" as const,
    opacity: "1",
    fontSize: "1.25rem",
    minWidth: "120px",
    maxWidth: "200px",
    borderRadius: "3%",
    fontFamily: "agency-fb-regular, sans-serif",
  };

  return (
    <Box>
      {options.map((number) => (
        <CheckBox key={number}>
          <input
            type="checkbox"
            id={name + number}
            name="tente"
            onChange={changeCheckBox}
            value={number}
            checked={value.find((item) => item === number) !== undefined}
          />
          <label htmlFor={name + number}>
            <div className="content tooltip">
              <Tooltip
                title={skillsDesc[number]}
                placement="top"
                overlayInnerStyle={tooltipStyle}
              >
                <IconItem
                  src={"/skill/" + skills[number] + ".png"}
                  size={"3.188rem"}
                />
              </Tooltip>
            </div>
          </label>
        </CheckBox>
      ))}
    </Box>
  );
};

export default Ability;
