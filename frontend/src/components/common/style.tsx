import styled from "styled-components";

interface IconItemProps {
  size?: string;
}

export const Container = styled.div`
  max-width: 110rem;
  width: 100%;
  margin: 0 auto;
  display: flex;
`;

export const ContainerFull = styled.div`
  max-width: 120rem;
  margin: 0 auto;
  display: flex;
  width: 100%;
  align-items: center;
  @media (max-width: 820px) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 0.75rem;
    padding: 0.4rem 0.5rem;
  }
`;

export const Title = styled.h3`
  font-size: 2.375rem;
  color: #fff;
`;

export const Tag = styled.div`
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.33;
  letter-spacing: 0.04em;
  color: #fff;
  padding: 0.313rem 0.5rem;
  border-radius: var(--radius-sm, 6px);
  background-color: var(--accent, #ff973a);
  margin: 0.438rem 0rem;
  width: fit-content;
  white-space: nowrap;
  text-transform: uppercase;
  &.legend {
    background-color: #ff0759;
    color: #fff;
  }
  &.green {
    min-width: 4.875rem;
    text-align: center;
    background: #3aca22;
  }
  &.uppercase {
    text-transform: uppercase;
  }

  &.rare {
    background: #3aca22;
  }

  &.common {
    background: #d5d5d5;
    color: black;
  }
  &.superrare {
    background: #a507ff;
  }
  &.epic {
    background: #ff00f0;
  }
  &.legend {
    background: #ffc207;
  }
  &.superlegend {
    background: #ff0759;
  }
`;

export const IconItem = styled.img<IconItemProps>`
  width: ${(props) => props.size || " 2.5rem"};
  height: ${(props) => props.size || " 2.5rem"};
  object-fit: cover;
`;
export const IconSkill = styled.img`
  width: 1.5rem;
  height: 1.5rem;
  object-fit: cover;
  padding: 3px 4px 3px 5px;
  border-radius: 3px;
  background-color: #272d47;
`;

export const IconCoinStake = styled.img`
  width: 2rem;
  height: 2rem;
  object-fit: cover;
  padding: 3px 4px 3px 5px;
`;

export const TitleAgency = styled.div`
  font-family: "Sora", sans-serif;
  font-size: 2.031rem;
  color: #fff;
  margin-bottom: 1.563rem;
`;

export const CardItem = styled.div`
  border: solid 1px var(--border, #343849);
  background-color: var(--surface, #191b24);
  padding: 1rem;
  width: fit-content;
  border-radius: var(--radius, 10px);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out,
    border-color 0.2s ease-in-out;
  &:hover {
    border-color: var(--accent, #ff973a);
    box-shadow: var(--shadow, 0 6px 20px rgba(0, 0, 0, 0.35));
    transform: translateY(-3px);
  }
  .header {
    display: flex;
    & > div {
      margin: 0rem 1rem 0 0;
    }
  }
  .icon-hero {
    margin: 2rem 8rem;
    display: flex;
    flex-direction: column;
    justify-content: center;

    img {
      width: 6.875rem;
      height: 9rem;
      object-fit: contain;
    }
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2.563rem;
    margin-bottom: 1.125rem;
    img {
      width: 30px;
      height: 1.563rem;
    }
    b {
      font-size: 1.25rem;
      font-weight: bold;
      line-height: 1.3;
      color: #fff;
      margin: 0px 0.438rem;
    }
    span {
      font-size: 0.938rem;
      line-height: 1.3;
      color: #fff;
    }
  }
  .level {
    padding: 1rem 0;
    text-align: center;
  }
  .buy-wrap {
    text-align: center;
    margin-bottom: 2rem;
    & > div {
      display: inline-block;
    }
  }
`;
