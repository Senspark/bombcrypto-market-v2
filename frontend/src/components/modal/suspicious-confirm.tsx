import React from "react";
import styled from "styled-components";
import { Modal } from "antd";
import Close from "../icons/close";
import { SuspiciousFlag } from "../../types/hero";
import { suspiciousDetail, suspiciousTitle } from "../common/suspicious";

interface SuspiciousConfirmProps {
  flag: SuspiciousFlag;
  tokenId: string | number;
  hide: () => void;
  confirm: () => void;
  isShowing?: boolean;
}

/** Shown before buying a flagged hero. Acknowledgement only, never a block. */
const SuspiciousConfirm: React.FC<SuspiciousConfirmProps> = ({
  flag,
  tokenId,
  hide,
  confirm,
  isShowing = true,
}) => {
  return (
    <ContentModal open={isShowing} footer={false} onCancel={hide}>
      <div className="head-modal">
        <div className="icon" onClick={hide}>
          <Close />
        </div>
      </div>

      <div className="warn-title">⚠ {suspiciousTitle(flag)}</div>
      <div className="warn-detail">
        Hero #{tokenId}: {suspiciousDetail(flag)}
      </div>
      <div className="warn-detail">
        Such heroes are often sold below market price to move them quickly, and
        may be reclaimed or blacklisted later. Buying is at your own risk.
      </div>

      <div className="block-button">
        <button className="cancel" onClick={hide}>
          Cancel
        </button>
        <button className="danger" onClick={confirm}>
          I understand, buy anyway
        </button>
      </div>
    </ContentModal>
  );
};

const ContentModal = styled(Modal)`
  .ant-modal-content {
    background-color: rgb(36, 39, 53);
  }
  .head-modal {
    display: flex;
    margin-bottom: 2rem;
    align-items: center;
    .icon {
      position: absolute;
      top: 1rem;
      right: 1rem;
      border-radius: 100px;
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: 0.3s ease-in-out;
      svg {
        width: 1.5rem;
        height: 1.5rem;
        fill: white;
      }
      &:hover {
        background: black;
      }
    }
  }

  .warn-title {
    color: #ff5c8a;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }

  .warn-detail {
    font-size: 1.05rem;
    color: #8a8fa4;
    text-align: center;
    margin-top: 0.75rem;
    max-width: 34rem;
    line-height: 1.5;
  }

  .block-button {
    margin: 2rem 0rem 1rem;
    display: flex;
    justify-content: center;
    gap: 1rem;
    button {
      padding: 0.938rem 2.125rem;
      border-radius: 3px;
      font-size: 1.125rem;
      line-height: 1;
      cursor: pointer;
      font-weight: 500;
      border: none;
      box-shadow: none;
      transition: all 0.3s ease-in-out;
      &.cancel {
        color: #fff;
        background-color: #3f4564;
      }
      &.danger {
        color: #fff;
        background-color: #ff0759;
      }
      &:hover {
        opacity: 0.85;
      }
    }
  }
`;

export default SuspiciousConfirm;
