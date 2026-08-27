import React from "react";
import Statistics from "../components/layouts/Statistics";
import { Title, Container } from "../components/common/style";
import Bhero from "../components/recently/bhero";
import BheroSold from "../components/recently/bhero-sold";
import styled from "styled-components";

const WrapRecently = styled(Container)`
  flex-wrap: wrap;
  gap: 9rem;
  min-height: 80vh;
  & > div {
    flex: 1 1 40rem;
    min-width: 0;
  }
  @media (max-width: 1440px) {
    gap: 6rem;
  }
  @media (max-width: 1024px) {
    gap: 2rem;
  }
`;

const Wrap = styled.div`
  margin-bottom: 4.75rem;
`;

const Dashboard: React.FC = () => {
  return (
    <Wrap>
      <Statistics />
      <WrapRecently>
        <div className="item-layout">
          <Title className="agency">Recently listed</Title>
          <Bhero />
        </div>
        <div className="item-layout">
          <Title className="agency">Recently sold</Title>
          <BheroSold />
        </div>
      </WrapRecently>
    </Wrap>
  );
};

export default Dashboard;
