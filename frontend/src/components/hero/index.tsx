import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { renderURLHero, heroIconCrop } from "../../utils/helper";

const ICON_WIDTH = "4.875rem";

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

  const heroSrc = "/hero/" + renderURLHero(data.skin, data.color) + ".png";
  const cropAspect = heroIconCrop[data.skin];

  return (
    <IconHero>
      {cropAspect ? (
        // Clip the wide source art down to a portrait frame; original image is untouched.
        <span
          style={{
            display: "block",
            width: ICON_WIDTH,
            height: `calc(${ICON_WIDTH} / ${cropAspect})`,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <img
            style={{
              height: "100%",
              width: "auto",
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
            src={heroSrc}
            alt=""
          />
        </span>
      ) : (
        <img
          style={{ width: ICON_WIDTH, height: "auto" }}
          src={heroSrc}
          alt=""
        />
      )}
      <IconS src={iconUrl} style={iconStyle} />
    </IconHero>
  );
};
