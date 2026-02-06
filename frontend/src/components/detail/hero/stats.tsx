import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { levelToPower } from "../../../utils/helper";
import { IconSkill } from "../../common/style";
import { getShieldData } from "../../Service/api";
import { BHero } from "../../../types";

const Box = styled.div`
  width: 100%;
  margin-top: 4rem;
`;

export const IconCoinStake = styled.img`
  width: 2.7rem;
  height: 2.7rem;
  object-fit: cover;
  padding: 3px 4px 3px 5px;
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

  .staked {
    .title {
      margin-top: 7px;
    }
    & > div {
      .skill {
        display: flex;
        align-items: center;
      }
      img {
        width: 2.5rem;
        height: 2.5rem;
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
  data: BHero;
  network: string;
}

export const Stats: React.FC<StatsProps> = ({ data, network }) => {
  const addPower = levelToPower[data.level] || 0;
  const [staked, setStaked] = useState<number>(0);
  const [stakedSen, setStakedSen] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountRef = useRef<boolean>(false);

  console.log(data);

  useEffect(() => {
    unmountRef.current = false;
    fetchdata();
    return () => {
      unmountRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const fetchdata = async () => {
    if (unmountRef.current) {
      return;
    }
    const resp = await getShieldData(data?.token_id, network);
    setStaked(Math.floor(resp?.currentStakeBcoin || 0));
    setStakedSen(Math.floor(resp?.currentStakeSen || 0));
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      fetchdata();
    }, 60000);
  };

  return (
    <Box>
      <Title>Stats</Title>
      <Content>
        <div className="skills">
          <div>
            <h4 className="title">POWER</h4>
            <div className="skill">
              <IconSkill src="/icons/skill2.webp" />
              <span>
                {data.bomb_power}
                {addPower !== 0 && <em className="add">(+{addPower})</em>}
              </span>
            </div>
          </div>
          <div>
            <h4 className="title">SPEED</h4>
            <div className="skill">
              <IconSkill src="/icons/skill1.webp" />
              <span>{data.speed}</span>
            </div>
          </div>
          <div>
            <h4 className="title">STAMINA</h4>
            <div className="skill">
              <IconSkill src="/icons/skill5.webp" />
              <span>{data.stamina}</span>
            </div>
          </div>
          <div>
            <h4 className="title">BOMB NUM</h4>
            <div className="skill">
              <IconSkill src="/icons/skill3.webp" />
              <span>{data.bomb_count}</span>
            </div>
          </div>
          <div>
            <h4 className="title">RANGE</h4>
            <div className="skill">
              <IconSkill src="/icons/skill4.webp" />
              <span>{data.bomb_range}</span>
            </div>
          </div>
        </div>
        <div className="staked">
          <h4 className="title">STAKED</h4>
          <div>
            <div className="skill">
              <IconCoinStake src="/icons/token.png" />
              <span>{staked ? staked : 0}</span>
            </div>
            <div className="skill">
              <IconCoinStake src="/icons/sen_token.png" />
              <span>{stakedSen ? stakedSen : 0}</span>
            </div>
          </div>
        </div>
      </Content>
    </Box>
  );
};
