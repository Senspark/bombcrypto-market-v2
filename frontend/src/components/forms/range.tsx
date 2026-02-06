import React, { useState } from "react";
import styled from "styled-components";
import { Range } from "rc-slider";
import "rc-slider/assets/index.css";

const RangeWrap = styled.div`
  padding-bottom: 2rem;
  .slider {
    .rc-slider-rail {
      background-color: #151515;
      height: 3px;
    }
    .rc-slider-track {
      background-color: #ff973a;
      height: 3px;
      top: 50%;
      transform: translateY(-50%);
    }
    .rc-slider-mark-text {
      font-size: 15px;
      font-weight: normal;
      font-stretch: normal;
      font-style: normal;
      line-height: 1.67;
      letter-spacing: normal;
      text-align: left;
      color: #fff;
    }
    .rc-slider-handle {
      border: none !important;
      box-shadow: none !important;
    }
  }
`;

interface MarksMap {
  [key: number]: number;
}

const mapMark = (value: number[]): MarksMap => {
  const [min, max] = value;
  const maps: MarksMap = {};
  maps[min] = min;
  maps[max] = max;
  return maps;
};

interface RangeProps {
  init?: string[];
  min: number;
  max: number;
  name: string;
  onChange?: (name: string, value: string[]) => void;
}

const RangeCom: React.FC<RangeProps> = ({ init, min, max, name, onChange = () => {} }) => {
  let convert: (string | number)[] = [];
  if (!init) convert = [1, 5];
  else {
    const first = init[0];
    const last = init[1];
    convert = [first.slice(first.length - 1), last.slice(last.length - 1)];
  }

  const [value, setValue] = useState<number[]>(
    convert.map((element) => parseInt(String(element)))
  );

  const onChangeRang = (newValue: number[]) => {
    setValue(newValue);
    const value_gte = ["gte:" + newValue[0], "lte:" + newValue[1]];
    onChange(name, value_gte);
  };

  const marks = mapMark(value);

  return (
    <RangeWrap>
      <Range
        min={min}
        marks={marks}
        max={max}
        step={1}
        value={value}
        className="slider"
        onChange={onChangeRang}
      />
    </RangeWrap>
  );
};

export default RangeCom;
