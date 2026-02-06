import React, { memo } from "react";
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

const HeroIconComponent: React.FC<HeroIconProps> = ({
  data,
  heroType = "L",
  iconStyle = {}
}) => {
  // Optimization: Calculate iconUrl synchronously to avoid effect/state overhead
  // This prevents double rendering on mount and simplifies the component logic
  const iconUrl = heroType === "S" ? "/icons/HeroSIcon.png" : "/icons/Icon_L.png";

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

// Optimization: Use React.memo to prevent unnecessary re-renders when parent components update
// but props (data, heroType) remain unchanged.
export const HeroIcon = memo(HeroIconComponent);
