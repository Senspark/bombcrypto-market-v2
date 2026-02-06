import React from "react";
import styled from "styled-components";
import { mapHouseDetail } from "../../../utils/helper";
import { IconSkill } from "../../common/style";
import { BHouse } from "../../../types";

const Box = styled.div`
  width: 100%;
  margin-top: 4rem;
`;

const Content = styled.div`
  background: #191b24;
  border-radius: 3px;
  padding: 3rem 4rem;
  border: solid 1px #343849;
  h4 {
    font-size: 1.1rem;
    opacity: 0.7;
    color: white;
    font-weight: 400;
  }

  .skills {
    display: flex;
    justify-content: space-between;
    & > div {
      .skill {
        display: flex;
        align-items: center;
      }
      img {
        width: 2rem;
        height: 2rem;
      }
      span {
        opacity: 0.5;
        color: white;
        font-size: 1.5rem;
        font-weight: 500;
        margin-left: 0.5rem;
      }
    }
  }
`;

const Title = styled.h4`
  font-size: 2rem;
  opacity: 0.7;
  color: white;
`;

interface StatsProps {
  data: BHouse;
}

export const Stats: React.FC<StatsProps> = ({ data }) => {
  const info = mapHouseDetail[data.rarity];
  return (
    <Box>
      <Title>Stats</Title>
      <Content>
        <div className="skills">
          <div>
            <h4 className="title">ENERGY/MINUTES</h4>
            <div className="skill">
              <IconSkill src="/icons/pin.jpg" />
              <span>{info.charge}</span>
            </div>
          </div>
          <div>
            <h4 className="title">TOTAL AREA</h4>
            <div className="skill">
              <IconSkill src="/icons/size.jpg" />
              <span>{info.size}</span>
            </div>
          </div>

          <div>
            <h4 className="title">HERO SLOT</h4>
            <div className="skill">
              <IconSkill src="/icons/slot.jpg" />
              <span>{data.capacity}</span>
            </div>
          </div>
        </div>
      </Content>
    </Box>
  );
};
