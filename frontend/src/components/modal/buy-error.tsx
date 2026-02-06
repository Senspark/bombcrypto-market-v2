import React from "react";
import styled from "styled-components";
import Close from "../icons/close";
import { Modal } from "antd";

interface BuyErrorData {
  token_id?: string | number;
  id?: string | number;
  [key: string]: any;
}

interface BuyErrorProps {
  data?: BuyErrorData;
  id?: string | number;
  hide: () => void;
  message?: string;
  reload?: () => void;
  bType?: string;
  isShowing: boolean;
}

const BuyError: React.FC<BuyErrorProps> = ({ data, id, hide, message, reload, bType, isShowing }) => {
  const displayId = id || data?.token_id || data?.id;

  const oke = () => {
    if (reload) reload();
    hide();
  };

  return (
    <ContentModal open={isShowing} footer={false} onCancel={hide}>
      <div className="head-modal">
        <div className="icon" onClick={hide}>
          <Close />
        </div>
        <img src="/icons/sell.webp" alt="" />
        <div className="agency">
          {bType ? bType : "Bhero"} <span>#{displayId}</span>
        </div>
      </div>

      <div className="content">
        <img src="/icons/notfound_shop.png" alt="" />
      </div>
      <div className="des-bottom agency">{message}</div>
      <div className="block-button">
        <button onClick={oke}>{reload ? "Reload page" : "OK"}</button>
      </div>
    </ContentModal>
  );
};

const ContentModal = styled(Modal)`
  /* padding: 1rem; */
  .ant-modal-content {
    background-color: rgb(36, 39, 53);
    .ant-select-arrow {
      color: #fff;
    }
  }
  .head-modal {
    display: flex;
    margin-bottom: 3rem;
    align-items: center;
    img {
      width: 1.5rem;
      height: 1.5rem;
    }
    div {
      margin-left: 1rem;
      font-size: 1.5rem;
      line-height: 1.2;
      color: white;
      white-space: nowrap;
    }
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

  .content {
    text-align: center;
    img {
      width: 4rem;
      height: 4rem;
      object-fit: contain;
    }
  }

  .des-bottom {
    font-size: 1.5rem;
    color: #8a8fa4;
    text-align: center;
    margin-top: 1rem;
    max-width: 40rem;
  }
  .block-button {
    margin: 2rem 0rem;
    display: flex;
    justify-content: center;
    button {
      padding: 0.938rem 2.125rem 0.938rem 2.125rem;
      border-radius: 3px;
      font-size: 1.125rem;
      text-align: center;
      color: #381a09;
      box-sizing: border-box;
      line-height: 1;
      background: none;
      cursor: pointer;
      font-weight: 500;
      border-radius: 3px;
      background-color: #ff973a;
      border: none;
      box-shadow: none;
      display: flex;
      align-items: center;
      transition: all 0.3s ease-in-out;
      img {
        width: 1.75rem;
        height: 1.75rem;
        margin-right: 1.125rem;
      }
      &.disable {
        opacity: 0.5;
        cursor: wait;
      }
    }
  }
`;

export default BuyError;
