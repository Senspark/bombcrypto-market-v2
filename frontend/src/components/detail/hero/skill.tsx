import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { skills, skillsDesc, skillsDescHeroS, skillsHeroS } from "../../../utils/helper";
import { IconItem } from "../../common/style";
import { useAccount } from "../../../context/account";
import { getShieldData } from "../../Service/api";
import _ from "lodash";
import { HeroType } from "../../../utils/config";
import { BHero, ShieldOutput } from "../../../types";

const Box = styled.div`
  width: 100%;
  margin-top: 4rem;
`;

const Content = styled.div`
  background: #191b24;
  border-radius: 3px;
  padding: 3rem 8rem;
  border: solid 1px #343849;
  h4 {
    font-size: 1.1rem;
    opacity: 0.7;
    color: white;
    font-weight: 400;
  }

  .skills {
    display: flex;
    /* & > div {
      margin: 0px 20px;
    } */
    img {
      margin-right: 2rem;
      width: 4rem;
      height: 4rem;
    }

    .shield {
      align-content: center;
      opacity: 0.5;
      color: white;
      font-size: 1.5rem;
      font-weight: 500;
      margin-left: 0.5rem;
    }
  }
`;

const Title = styled.h4`
  font-size: 2rem;
  opacity: 0.7;
  color: white;
`;

const WrapSkill = styled.div`
  position: relative;
  img {
    cursor: pointer;
  }
  &:hover {
    .tooltiptext {
      opacity: 1;
    }
  }
  .tooltiptext {
    position: absolute;
    opacity: 0;
  }
`;

interface SkillProps {
  data: BHero;
}

export const Skill: React.FC<SkillProps> = ({ data }) => {
  const isHeroS =
    !_.isEmpty(data?.abilities_hero_s) &&
    !_.includes(data?.abilities_hero_s, 0);
  const { network } = useAccount();
  const abilities = data.abilities.map((item) => (typeof item === 'string' ? parseInt(item) : item)) || [];
  const abilities_hero_s = data.abilities_hero_s || [];
  const [shieldData, setShieldData] = useState<ShieldOutput | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const resp = await getShieldData(data.token_id, network);
    setShieldData(resp);
  };

  return (
    <Box>
      <Title>Skill</Title>
      <Content>
        <div className="skills">
          {abilities
            .sort(function (a, b) {
              return a - b;
            })
            .map((element) => (
              <WrapSkill className="tooltip" key={element}>
                <IconItem
                  src={"/skill/" + skills[element] + ".png"}
                />
                <span className="tooltiptext">
                  {skillsDesc[element]}
                </span>
              </WrapSkill>
            ))}

          {abilities_hero_s
            .sort(function (a, b) {
              return a - b;
            })
            .map((element) => {
              if (element === 0) return null;

              return (
                <WrapSkill className="tooltip" key={element}>
                  <IconItem
                    src={"/skill/" + skillsHeroS[element] + ".png"}
                  />
                  <span className="tooltiptext">
                    {skillsDescHeroS[element]}
                  </span>
                </WrapSkill>
              );
            })}
          {!isHeroS && shieldData?.heroType === HeroType.lStake && (
            <WrapSkill className="tooltip">
              <IconItem src={"/skill/shield_icon.png"} />
              <span className="tooltiptext">Immune to Thunder</span>
            </WrapSkill>
          )}
          {(isHeroS || shieldData?.heroType === HeroType.lStake) && (
            <span className="shield">{shieldData?.shieldAmount}</span>
          )}
        </div>
      </Content>
    </Box>
  );
};
