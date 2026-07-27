import React, { ReactNode } from "react";
import styled from "styled-components";

interface RentalModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons rendered in the footer. */
  footer?: ReactNode;
}

/**
 * Shared dialog for the rental screens, styled after the marketplace panels.
 *
 * The inner nodes are plain elements (styled through the wrapper's nested CSS)
 * because styled-components ships its own @types/react, and handing it a
 * ReactNode coming from this app's React trips the type checker.
 */
const RentalModal: React.FC<RentalModalProps> = ({ title, onClose, children, footer }) => (
  <Backdrop onClick={onClose}>
    <div className="panel" onClick={(e) => e.stopPropagation()}>
      <div className="head">
        <h2>{title}</h2>
        <button type="button" className="close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="body">{children}</div>
      {footer && <div className="foot">{footer}</div>}
    </div>
  </Backdrop>
);

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(9, 10, 15, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;

  .panel {
    width: min(30rem, 100%);
    background-color: #191b24;
    border: solid 1px #343849;
    border-radius: 4px;
    box-shadow: 0 1.25rem 3rem rgba(0, 0, 0, 0.5);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #343849;

    h2 {
      margin: 0;
      color: #fff;
      font-size: 1.75rem;
      font-family: "agency-fb-regular", sans-serif;
    }

    .close {
      background: none;
      border: none;
      color: #a6afd7;
      font-size: 1.75rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 0.25rem;

      &:hover {
        color: #fff;
      }
    }
  }

  .body {
    padding: 1.5rem;
    color: #fff;
  }

  .foot {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    border-top: 1px solid #343849;

    button {
      padding: 0.813rem 1.875rem;
      border-radius: 3px;
      font-size: 1.063rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      background-color: #ff973a;
      color: #381a09;

      &.ghost {
        background: transparent;
        color: #fff;
        border: 1px solid #4b5170;
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }
  }
`;

export default RentalModal;
