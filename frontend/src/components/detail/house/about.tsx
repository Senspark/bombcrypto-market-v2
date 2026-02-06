import React from "react";
import styled from "styled-components";
import Copy from "../../common/copy";
import { BHouse } from "../../../types";

const Box = styled.div`
  width: 100%;
`;

const Content = styled.div`
  background: #191b24;
  border-radius: 3px;
  padding: 1rem 4rem;
  border: solid 1px #343849;
  h4 {
    font-size: 1.1rem;
    opacity: 0.7;
    color: white;
    font-weight: 400;
    margin-bottom: 0;
  }
  p {
    opacity: 0.5;
    color: white;
    font-size: 1rem;
  }
`;

const Title = styled.h4`
  font-size: 2rem;
  opacity: 0.7;
  color: white;
`;

const LinkProfile = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.2rem;
  max-width: fit-content;
  span {
    opacity: 0.5;
    color: white;
    font-size: 1rem;
  }
`;

interface AboutProps {
  data: BHouse;
}

export const About: React.FC<AboutProps> = ({ data }) => {
  const origin = window.location.origin;

  return (
    <Box>
      <Title>About</Title>
      <Content>
        <h4>OWNER</h4>
        <p>{data.seller_wallet_address}</p>
        <h4>PROFILE LINK</h4>
        <div>
          <LinkProfile>
            <Copy data={origin + `/market/bhouse/${data.token_id}`} />
            <span>{data.token_id}</span>
          </LinkProfile>
        </div>
      </Content>
    </Box>
  );
};
