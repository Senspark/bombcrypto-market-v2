import React, { useState } from "react";
import styled from "styled-components";
import { Copy } from "../../components/icons";

interface CopyFuncProps {
  data: string;
}

const CopyFunc: React.FC<CopyFuncProps> = ({ data }) => {
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
    // navigator.clipboard.writeText(data);
    setMessage("Copied");
  };

  const resetMessage = () => {
    setMessage("Copy to clipboard");
  };

  return (
    <Wrap>
      <button
        type="button"
        className="icon tooltip"
        onMouseLeave={resetMessage}
        onBlur={resetMessage}
        onClick={onclick}
        aria-label={message}
      >
        <span className="tooltiptext">{message}</span>
        <Copy />
      </button>
    </Wrap>
  );
};

export default CopyFunc;

const Wrap = styled.div`
  .icon {
    position: relative;
    display: flex;
    justify-content: center;
    cursor: pointer;
    transition: 0.2s ease-in-out;
    text-align: center;
    padding: 0.2rem;
    border-radius: 3px;

    /* Reset button styles */
    background: transparent;
    border: none;
    font-family: inherit;

    &:hover, &:focus-visible {
      transform: scale(1.1);
      outline: none;
    }
    svg {
      height: 1rem;
      fill: white;
    }
  }

  .tooltip {
    position: relative;
    display: inline-block;
  }

  .tooltip .tooltiptext {
    visibility: hidden;
    width: fit-content;
    color: #fff;
    text-align: center;
    border-radius: 3px;
    padding: 5px;
    position: absolute;
    top: 150%;
    left: 50%;
    margin-left: -75px;
    opacity: 0;
    transition: opacity 0.3s;
    background: #ffffff73;
    font-family: "agency-fb-regular", sans-serif;
    display: block;
    white-space: nowrap;
    z-index: 1000;
    max-width: fit-content;
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

  .tooltip:hover .tooltiptext,
  .tooltip:focus-visible .tooltiptext {
    visibility: visible;
    opacity: 1;
  }
`;
