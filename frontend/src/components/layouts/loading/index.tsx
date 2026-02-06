import React from "react";
import styled from "styled-components";
import { BoxLoading } from "react-loadingg";

const LoadingCom: React.FC = () => {
  return (
    <Loading>
      <BoxLoading size="large" color="#ff973a" />;
    </Loading>
  );
};

const Loading = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

export default LoadingCom;
