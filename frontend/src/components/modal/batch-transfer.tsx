import React, { useState } from "react";
import styled from "styled-components";
import Close from "../icons/close";
import { Modal } from "antd";
import { isAddress } from "ethers";

interface BatchTransferModalProps {
  isShowing: boolean;
  hide: () => void;
  confirm: (toAddress: string) => void;
  selectedCount: number;
  currentAddress: string;
}

const BatchTransferModal: React.FC<BatchTransferModalProps> = ({
  isShowing,
  hide,
  confirm,
  selectedCount,
  currentAddress,
}) => {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!address) {
      setError("Address is required.");
      return;
    }
    if (!isAddress(address)) {
      setError("Invalid EVM address.");
      return;
    }
    if (address === "0x0000000000000000000000000000000000000000") {
      setError("Cannot transfer to the zero address.");
      return;
    }
    if (address.toLowerCase() === currentAddress.toLowerCase()) {
      setError("Cannot transfer to your own address.");
      return;
    }
    setError("");
    confirm(address);
  };

  return (
    <ContentModal open={isShowing} footer={false} onCancel={hide}>
      <div className="head-modal">
        <div className="icon" onClick={hide}>
          <Close />
        </div>
        <img src="/icons/sell.webp" alt="" />
        <div className="agency">
          Batch Transfer <span>({selectedCount} items)</span>
        </div>
      </div>
      <div className="des-bottom agency">
        Enter the destination wallet address. Please double check this address, as transfers are irreversible.
      </div>

      <InputContainer>
        <input
          type="text"
          placeholder="0x..."
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (error) setError("");
          }}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </InputContainer>

      <div className="block-button">
        <button onClick={handleConfirm}>Transfer</button>
        <button className="cancel" onClick={hide}>
          Cancel
        </button>
      </div>
    </ContentModal>
  );
};

const InputContainer = styled.div`
  margin-top: 2rem;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: #191b24;
    border: 1px solid #343849;
    color: white;
    border-radius: 4px;
    font-size: 1.1rem;
    &:focus {
      outline: none;
      border-color: #ff973a;
    }
  }
`;

const ErrorMessage = styled.span`
  color: #ff0759;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

const ContentModal = styled(Modal)`
  .ant-modal-content {
    background-color: rgb(36, 39, 53);
    .ant-select-arrow {
      color: #fff;
    }
  }
  .head-modal {
    display: flex;
    margin-bottom: 2rem;
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

  .des-bottom {
    font-size: 1.2rem;
    color: #8a8fa4;
    text-align: center;
    margin-top: 1rem;
    padding: 0 1rem;
  }
  .block-button {
    margin: 2rem 0rem;
    display: flex;
    justify-content: space-around;
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
      &.cancel {
        background-color: white;
      }
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

export default BatchTransferModal;
