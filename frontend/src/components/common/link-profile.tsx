import React from "react";
import { Link } from "react-router-dom";
import Copy from "./copy";
import styled from "styled-components";

const Wrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.2rem;
  max-width: fit-content;
  a {
    color: #8d95b7;
    text-decoration: underline;
    &:hover {
      color: #e2e2e2;
      text-decoration: underline;
    }
  }
`;

interface LinkProfileProps {
  type: string;
  id: string | number;
}

const LinkProfile: React.FC<LinkProfileProps> = ({ type, id }) => {
  const origin = window.location.origin;
  const url = `/market/${type}/${id}`;
  return (
    <Wrap className="">
      <Copy data={origin + url} />
      <Link to={url}>{id}</Link>
    </Wrap>
  );
};
export default LinkProfile;
