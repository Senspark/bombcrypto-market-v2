import React, { useState } from "react";
import styled from "styled-components";
import { minAddress } from "../../utils/helper";

interface CopyWithoutIconProps {
  data: string;
}

const CopyWithouIconFunc: React.FC<CopyWithoutIconProps> = ({ data }) => {
  const [message, setMessage] = useState<string>("Copy to clipboard");
  function copyToClipboard(textToCopy: string): Promise<void> {
    // navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
      // navigator clipboard api method'
      return navigator.clipboard.writeText(textToCopy);
    } else {
      // text area method
      let textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      // make the textarea out of viewport
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      return new Promise((res, rej) => {
        // here the magic happens
        document.execCommand("copy") ? res() : rej();
        textArea.remove();
      });
    }
  }
  const onclick = (): void => {
    copyToClipboard(data);
    setMessage("Copied");
  };

  return (
    <Wrap style={{ display: "inline" }}>
      <div
        className="icon tooltip"
        onMouseLeave={() => {
          setMessage("Copy to clipboard");
        }}
        onClick={onclick}
      >
        <span className="tooltiptext">{message}</span>
        {minAddress(data)}
      </div>
    </Wrap>
  );
};

export default CopyWithouIconFunc;

const Wrap = styled.div`
  .tooltip {
    position: relative;
    display: inline-block;
    cursor: pointer;
  }

  .tooltip .tooltiptext {
    font-size: 1rem;
    font-weight: bold;
    visibility: hidden;
    min-width: 120px;
    color: #fff;
    text-align: center;
    border-radius: 3px;
    padding: 0px;
    position: absolute;
    z-index: 1;
    top: 95%;
    left: 50%;
    margin-left: -55px;
    opacity: 0;
    transition: opacity 0.3s;
    background: #ffffff73;
    font-family: "agency-fb-regular", sans-serif;
  }

  .tooltip .tooltiptext::after {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent #555 transparent;
  }

  .tooltip:hover .tooltiptext {
    visibility: visible;
    opacity: 1;
  }
`;
