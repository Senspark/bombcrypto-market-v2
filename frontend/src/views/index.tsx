import React from "react";
import Statistics from "../components/layouts/Statistics";
import { Title, Container } from "../components/common/style";
import Bhero from "../components/recently/bhero";
import BheroSold from "../components/recently/bhero-sold";
import styled from "styled-components";

const WrapRecently = styled(Container)`
  gap: 9rem;
  min-height: 80vh;
  & > div {
    flex: 0 0 calc(50% - 4.5rem);
  }
  @media (max-width: 1440px) {
    gap: 6rem;
    & > div {
      flex: 0 0 calc(50% - 3rem);
    }
  }
  @media (max-width: 820px) {
    flex-direction: column;
    gap: 2.5rem;
    padding: 0 0.75rem;
    & > div {
      flex: 1 1 100%;
      width: 100%;
      min-width: 0;
    }
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
