import React, { useState } from "react";
import styled from "styled-components";
import { Tag } from "../common/style";
import SellModal from "../modal/sell";
import SellSuccess from "../modal/sell-success";
import SellFail from "../modal/sell-fail";
import Cancel from "../modal/cancel";
import Success from "../modal/success";
import Error from "../modal/error";
import { useModal } from "../modal";
import { useContract } from "../../context/smc";
import {
  bcoinFormat,
  mapTag,
  mapHouse,
  mapHouseDetail,
} from "../../utils/helper";
import { Bhouse, IMAGE_TOKEN_SHOW } from "../../utils/config";
import { useAccount } from "../../context/account";

interface HouseData {
  id?: string | number;
  token_id?: string | number;
  ref_id?: string | number;
  rarity: number;
  capacity: number;
  amount?: string | number | bigint;
  isToken?: string;
  block_timestamp?: string;
}

interface InventoryBhouseProps {
  isApprove: boolean;
  approve: () => void;
  data: HouseData;
  cancel?: string | number;
}

const BHeroFullWidth: React.FC<InventoryBhouseProps> = ({
  isApprove,
  approve,
  data,
  cancel,
}) => {
  const { isShowing, toggle } = useModal();
  const [status, setStatus] = useState("sell");
  const [message, setMessage] = useState("");
  const { cancelOrderBhouse, setLoading } = useContract();
  const { isSellable, minPrice } = Bhouse[data.rarity];
  const { clear } = useAccount();

  const sell = async () => {
    if (isSellable) {
      setStatus("sell");
      toggle();
    }
  };

  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    toggle();
  };

  const confirm = async () => {
    let block_sell = new Date(data.block_timestamp || "");
    block_sell.setMinutes(block_sell.getMinutes() + 5);
    let current = new Date();
    let seconds = (block_sell.getTime() - current.getTime()) / 1000;
    if (seconds >= 0) {
      let alert = new Date(seconds * 1000).toISOString().substr(14, 5);
      setStatus("block-cancel");
      setMessage("Please wait " + alert + " before Cancel selling");
      toggle();
      return;
    }
    setStatus("cancel");
    toggle();
  };

  const funcCancel = async () => {
    toggle();
    setLoading(true);
    try {
      await cancelOrderBhouse(data.token_id!);
      setStatus("cancel-success");
      setMessage("Successfully canceled sale");
      toggle();
    } catch (error) {
      toggle();
      setTimeout(() => {
        setStatus("error");
        setMessage("Not found order");
        toggle();
      }, 200);
    }
    setLoading(false);
  };

  const info = mapHouseDetail[data.rarity];

  return (
    <Item>
      <div className="icon-hero">
        <img
          src={"/house/" + mapHouse[data.rarity].replace(" ", "") + ".png"}
          alt=""
        />
      </div>
      <div className="info">
        <Tag>#{data.token_id ? data.token_id : data.id}</Tag>
        <Tag className={mapTag[data.rarity]}>{mapHouse[data.rarity]}</Tag>
      </div>
      <div className="flex-skill">
        <div>
          <div className="title">SIZE</div>
          <div className="skill"> {info.size} </div>
        </div>
        <div>
          <div className="title">CHARGE</div>
          <div className="skill">{info.charge}</div>
        </div>
        <div>
          <div className="title">CAPACITY</div>
          <div className="skill">{data.capacity}</div>
        </div>
      </div>
      <div className="action">
        {cancel && (
          <React.Fragment>
            <div className="coin">
              <img
                src={IMAGE_TOKEN_SHOW[data?.isToken || ""] || "/icons/token.png"}
                alt=""
              />
              <span>{bcoinFormat(data.amount)}</span>
              <div className="toolip">{bcoinFormat(data.amount)}</div>
            </div>
            <button onClick={confirm} className="cancel">
              Cancel selling
            </button>
          </React.Fragment>
        )}
        {!cancel && isApprove && (
          <button onClick={sell} className={isSellable ? "" : "no-sell"}>
            <img src="/icons/sell.webp" alt="" /> SELL
          </button>
        )}
        {!cancel && !isApprove && (
          <button className="approve" onClick={approve}>
            APPROVE
          </button>
        )}
      </div>
      {status === "sell" && (
        <SellModal
          setStatus={updateStatus}
          data={{ ...data, id: data.id || data.token_id || 0 }}
          hide={toggle}
          minPrice={minPrice}
          name={"BHouse"}
          isShowing={isShowing}
        />
      )}
      {status === "success" && (
        <SellSuccess
          data={data}
          hide={toggle}
          minPrice={minPrice}
          reload={clear.current}
          title="Bhouse"
          isShowing={isShowing}
        />
      )}
      {status === "fail" && (
        <SellFail
          data={data}
          hide={toggle}
          minPrice={minPrice}
          reload={clear.current}
          bType="Bhouse"
          isShowing={isShowing}
        />
      )}
      {status === "cancel" && (
        <Cancel
          data={data}
          hide={toggle}
          confirm={funcCancel}
          message={"Are you sure you want to stop selling this house?"}
          bType="Bhouse"
          isShowing={isShowing}
        />
      )}
      {status === "error" && (
        <Error
          data={data}
          hide={toggle}
          message={message}
          reload={clear.current}
          bType="Bhouse"
          isShowing={isShowing}
        />
      )}
      {status === "cancel-success" && (
        <Success
          id={data.token_id || data.ref_id || data.id}
          hide={toggle}
          message={message}
          title="Cancel Bhouse"
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status === "block-cancel" && (
        <Error
          data={data}
          hide={toggle}
          message={message}
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status === "error-notsell" && (
        <Error
          data={data}
          hide={toggle}
          message={message}
          isShowing={isShowing}
        />
      )}{" "}
    </Item>
  );
};

const Item = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 1.125rem 1.313rem;
  justify-content: space-between;
  border: solid 1px #343849;
  background-color: #191b24;
  .info {
    min-width: 10rem;
  }

  .icon-hero {
    margin-right: 4rem;
    width: 10rem;
    text-align: center;
    img {
      height: 5.5rem;
      object-fit: cover;
    }
  }
  .flex-skill {
    display: flex;
    justify-content: space-between;
    margin: 0 2rem;
    & > div {
      margin: 0 2.063rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    width: 24.313rem;
    .title {
      font-size: 0.813rem;
      line-height: 1.31;
      color: #a6afd7;
      margin-bottom: 0.688rem;
      text-align: center;
    }
    .copy {
      margin-left: 0.75rem;
      display: flex;
      align-items: center;
      cursor: pointer;

      &:hover {
        svg {
          height: 1.5rem;
          fill: white;
        }
      }
      svg {
        height: 1.5rem;
        fill: #c5cae1;
        transition: 0.3s ease-in-out;
      }
    }
  }
  .skill-item {
    display: flex;
    justify-content: space-between;

    img {
      margin-right: 0.75rem;
    }
  }
  .skill {
    font-size: 1.5rem;
    line-height: 1.31;
    text-align: center;
    color: #fff;
    display: flex;
    span {
      color: #7a81a4;
      display: inline-block;
      width: 1.563rem;
    }
  }
  .action {
    display: flex;
    margin-left: auto;
    .coin {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-right: 1rem;
      min-width: 7rem;
      img {
        width: 1.75rem;
        height: 2rem;
        object-fit: contain;
      }
      span {
        font-size: 1.313rem;
        font-weight: 500;
        line-height: 1.33;
        color: #fff;
        margin-left: 0.438rem;
      }
    }
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
      border-radius: 3px;
      background-color: #ff973a;
      border: none;
      box-shadow: none;
      display: flex;
      align-items: center;
      &.cancel {
        background: #ff0759;
        color: white;
        padding: 0.938rem 1.125rem 0.938rem 1.125rem;
      }
      &.approve {
        background-color: #e6903a !important;
        color: white;
        padding: 0.938rem 1.125rem;
      }
      &.no-sell {
        opacity: 0.5;
      }
      img {
        width: 1.75rem;
        height: 1.75rem;
        margin-right: 1.125rem;
      }
    }
  }
`;

export default BHeroFullWidth;
