import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { renderURLHero } from "../../utils/helper";

const IconHero = styled.div`
  position: relative;
`;

const IconS = styled.img`
  width: 45%;
  position: absolute;
  right: -7px;
  bottom: -3px;
`;

interface HeroData {
  skin: number;
  color: number;
  abilities_hero_s?: number[];
}

interface HeroIconProps {
  data: HeroData;
  heroType?: "L" | "L+" | "S";
  iconStyle?: React.CSSProperties;
}

export const HeroIcon: React.FC<HeroIconProps> = ({
  data,
  heroType = "L",
  iconStyle = {}
}) => {
  const [iconUrl, setIconUrl] = useState("");

  useEffect(() => {
    if (heroType === "S") {
      setIconUrl("/icons/HeroSIcon.png");
      return;
    }
    setIconUrl("/icons/Icon_L.png");
    return;
  }, [data, heroType]);

  return (
    <IconHero>
      <img
        style={{ width: "4.875rem", height: "6.313rem" }}
        src={"/hero/" + renderURLHero(data.skin, data.color) + ".png"}
        alt=""
      />
      <IconS src={iconUrl} style={iconStyle} />
    </IconHero>
  );
};
