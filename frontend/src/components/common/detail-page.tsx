import styled from "styled-components";

export const Card = styled.div`
  width: 14.5rem;
  border: solid 1px #343849;
  background-color: #191b24;
  padding: 0.563rem 0.438rem;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
  &:hover {
    background: #000000;
  }
  .header {
    display: flex;
    justify-content: space-between;
    & > div {
      margin: 0;
    }
  }
  .icon-hero {
    margin-top: 3.063rem;
    display: flex;
    justify-content: center;

    img {
      width: 6.875rem;
      height: 9rem;
    }
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2.563rem;
    margin-bottom: 1.125rem;
    img {
      width: 1.438rem;
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
`;
