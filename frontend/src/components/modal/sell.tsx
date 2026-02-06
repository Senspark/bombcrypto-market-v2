import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import styled from "styled-components";
import { useContract } from "../../context/smc";
import { fee, SmartContracts, NETWORK } from "../../utils/config";
import Close from "../icons/close";
import { useAccount } from "../../context/account";
import { Modal, Dropdown } from "antd";
import arrow_dropdown from "../../assets/images/arrow_dropdown.png";

interface SellModalData {
  id: string | number;
  token_id?: string | number;
  rarity?: string | number;
  abilities?: number[] | string[];
  bomb_power?: number;
  bomb_range?: number;
  stamina?: number;
  speed?: number;
  bomb_count?: number;
  [key: string]: any;
}

interface SellModalProps {
  data: SellModalData;
  hide: () => void;
  minPrice: number;
  setStatus: (status: any) => void;
  name: string;
  isShowing: boolean;
}

const SellModal: React.FC<SellModalProps> = ({ data, hide, minPrice, setStatus, name, isShowing }) => {
  const id = data.id;
  const [price, setPrice] = useState<number | undefined>();
  const [isShowCoin, setIsShowCoin] = useState(true);
  const { createOrder, createOrderBhouse } = useContract();
  const { network } = useAccount();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  let isUsePolygon = network === NETWORK.POLYGON;
  let senContract = isUsePolygon ? SmartContracts.senMatic : SmartContracts.sen;
  let bcoinContract = isUsePolygon
    ? SmartContracts.bcoinMatic
    : SmartContracts.bcoin;
  const [isValueSelect, setIsValueSelect] = useState(bcoinContract.address);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPrice(Number(value));
  };

  const isSellable = price !== undefined && price >= minPrice;

  const createOrderModal = async () => {
    if (!price && isSellable) return;
    hide();

    if (name === "BHouse") {
      const status = await createOrderBhouse(id, String(price!), isValueSelect);

      if (mountedRef.current) {
        setStatus(status);
      }
    } else {
      const status = await createOrder(id, String(price!), isValueSelect);
      if (mountedRef.current) {
        setStatus(status);
      }
    }
  };

  const handleSelectCoin = (value: string) => {
    if (value !== isValueSelect) {
      setIsValueSelect(value);
      setIsShowCoin((pre) => !pre);
    }
  };

  const items = [
    {
      key: "1",
      icon: (
        <img
          src="/icons/token.png"
          alt="token-bcoin"
          width="30px"
          height="30px"
          style={{ marginRight: "7px" }}
        />
      ),
      label: (
        <div
          style={{
            fontSize: "1.313rem",
            fontWeight: "bold",
            lineHeight: "1.14",
            color: "#fff",
            textAlign: "center" as const,
          }}
        >
          BCOIN
        </div>
      ),
      onClick: () => handleSelectCoin(bcoinContract.address),
    },
  ];

  const menuProps = {
    items,
    style: {
      backgroundColor: "#0b1749",
      width: "143px",
      marginTop: "-4px",
      borderRadius: "5px",
      marginLeft: "3px",
      border: "1px solid #434040"
    }
  };

  return (
    <ContentModal open={isShowing} width={800} footer={false} onCancel={hide}>
      <div className="head-modal">
        <img src="/icons/sell.webp" alt="" />
        <div className="agency">Sell {name}</div>
        <div className="icon" onClick={() => hide()}>
          <Close />
        </div>
      </div>
      <div className="agency des">
        Choose your sale method {name} <span>#{data.token_id || data.id}</span>
      </div>
      <RowCustom>
        <TextTite>Sell at</TextTite>
        <div className="box-input">
          <Dropdown menu={menuProps} placement="bottom" trigger={["click"]}>
            <ButtonDropdown>
              <img
                className="icon"
                src={isShowCoin ? "/icons/token.png" : "/icons/sen_token.png"}
                alt=""
              />
              <div className="text" style={{ marginLeft: "10px" }}>
                {isShowCoin ? "BCOIN" : "SEN"}
              </div>
              <img
                className="arrow"
                src={arrow_dropdown}
                alt=""
                style={{
                  width: "1.3rem",
                  height: "0.8rem",
                  marginLeft: "10px",
                }}
              />
            </ButtonDropdown>
          </Dropdown>
          <input
            onChange={onChange}
            type="number"
            className="agency"
            placeholder={isShowCoin ? "Enter BCOIN" : "Enter SEN"}
          />
        </div>
      </RowCustom>
      <div className="des-bottom min agency">
        Min price can sell{" "}
        <span className="coin">
          {minPrice} {isShowCoin ? "BCOIN" : "SEN"}
        </span>
      </div>
      <div className="des-bottom agency">
        You'll receive{" "}
        <span className="coin">
          {price ? (price * (100 - fee)) / 100 : 0}{" "}
          {isShowCoin ? "BCOIN" : "SEN"}
        </span>{" "}
        after <span className="fee">{fee}% fee</span> .
      </div>

      <div className="block-button">
        <button
          onClick={createOrderModal}
          disabled={!isSellable}
          className={!isSellable ? "disable" : ""}
        >
          <img src="/icons/sell.webp" alt="" /> SELL
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
    min-width: 58rem;
    display: flex;
    margin-bottom: 3rem;
    align-items: center;

    img {
      width: 1.5rem;
      height: 1.5rem;
    }
    div {
      margin-left: 1rem;
      font-size: 2.563rem;
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
  .des {
    font-size: 2.563rem;
    color: #8a8fa4;
    span {
      color: #38e58d;
    }
  }
  .content {
    display: flex;
    align-items: center;
    margin-top: 7.313rem;
    justify-content: center;
  }
  .box-input {
    height: 3.5rem;
    display: flex;
    align-items: center;
    border-radius: 4px;
    background-color: #151720;
    position: relative;

    img {
      width: 2.5rem;
      height: 2.5rem;
    }

    input {
      height: 3.5rem;
      background-color: #151720;
      border: none;
      padding-left: 3rem;
      font-size: 2.563rem;
      width: 100%;
      color: #fff;
      &:focus {
        background-color: #151720;
        outline: none;
        box-shadow: none;
        border: none;
      }
    }
  }

  .des-bottom {
    font-size: 1.781rem;
    color: white;
    text-align: center;
    margin-top: 1rem;
    .coin {
      color: #dfad25;
    }
    .fee {
      color: #0b67ff;
    }
  }
  .block-button {
    margin: 4.75rem 0rem;
    display: flex;
    justify-content: center;
    button {
      padding: 0.938rem 2.125rem 0.938rem 1.125rem;
      border-radius: 3px;
      font-size: 1.125rem;
      color: #381a09;
      box-sizing: border-box;
      line-height: 1;
      background: none;
      cursor: pointer;
      font-weight: 500;
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
  .select-sell-inventory {
    height: 3.5rem;
  }
`;

const RowCustom = styled.div`
  display: flex;
  align-items: center;
  margin-top: 7.313rem;
  justify-content: center;
`;

const TextTite = styled.div`
  font-size: 2.563rem;
  line-height: 1.2;
  color: white;
  margin-right: 2.313rem;
  white-space: nowrap;
  font-family: "agency-fb-regular", sans-serif;
`;

const ButtonDropdown = styled.button`
  display: flex;
  background-color: rgb(36, 39, 53);
  border: 1px solid #434040;
  box-shadow: none;
  height: 3.5rem;
  width: 200px;
  align-items: center;
  padding: 0 1rem;
  font-size: 1.313rem;
  font-weight: bold;
  line-height: 1.14;
  color: #fff;
  .icon {
    width: 1.5rem;
    height: 1.5rem;
    flex: 0;
  }

  .arrow {
    flex: 0;
  }

  .text {
    flex: 1;
  }
`;

export default SellModal;
