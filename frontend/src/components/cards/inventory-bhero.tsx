import React, { useState } from "react";
import styled from "styled-components";
import { Tag, IconItem, IconSkill, IconCoinStake } from "../common/style";
import SellModal from "../modal/sell";
import SellSuccess from "../modal/sell-success";
import Success from "../modal/success";
import SellFail from "../modal/sell-fail";
import Cancel from "../modal/cancel";
import Error from "../modal/error";
import { useModal } from "../modal";
import { useContract } from "../../context/smc";
import {
  mapRarity,
  skills,
  bcoinFormat,
  mapTag,
  levelToPower,
  skillsDesc,
  mapRarityShield,
} from "../../utils/helper";
import {
  Bhero,
  IMAGE_TOKEN_SHOW,
  HeroType,
  cooldownByBlockNumber,
} from "../../utils/config";
import { useAccount } from "../../context/account";
import { HeroIcon } from "../hero";
import _ from "lodash";
import { ShieldOutput, SuspiciousFlag } from "../../types/hero";
import { SuspiciousBadge } from "../common/suspicious";

interface HeroData {
  id?: string | number;
  tokenId?: string | number;
  ref_id?: string | number;
  rarity: number;
  level: number;
  bombPower: number;
  speed: number;
  stamina: number;
  bombCount: number;
  bombRange: number;
  abilities?: number[];
  abilitiesHeroS?: number[];
  amount?: string | number | bigint;
  isToken?: string;
  skin: number;
  color: number;
  nftBlockNumber?: number;
  blockTimestamp?: string;
  sellerWalletAddress?: string;
  shieldData?: ShieldOutput | null;
  suspicious?: SuspiciousFlag | null;
}

interface InventoryBheroProps {
  isApprove: boolean;
  approve: () => void;
  data: HeroData;
  cancel?: string | number;
}

const BHeroFullWidth: React.FC<InventoryBheroProps> = ({
  isApprove,
  approve,
  data,
  cancel,
}) => {
  const isHeroS =
    !_.isEmpty(data?.abilitiesHeroS) &&
    !_.includes(data?.abilitiesHeroS, 0);
  const { isShowing, toggle } = useModal();
  const [status, setStatus] = useState("sell");
  const [message, setMessage] = useState("");
  const { clear } = useAccount();
  const { cancelOrder, setLoading, getOrder, block } = useContract();
  const abilities = data.abilities || [];
  const { isSellable, minPrice } = Bhero[data.rarity];

  const isThroughThe7DayRule =
    block !== null && (data.nftBlockNumber || 0) < block - cooldownByBlockNumber;
  const shieldData = data.shieldData ?? null;
  const staked = Math.floor(shieldData?.currentStakeBcoin || 0);
  const stakedSen = Math.floor(shieldData?.currentStakeSen || 0);

  const sell = async () => {
    if (isSellable && isThroughThe7DayRule) {
      setStatus("sell");
      toggle();
    }
  };

  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    toggle();
  };

  const confirm = async () => {
    let block_sell = new Date(data.blockTimestamp || "");
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
      await getOrder(data.tokenId!);
    } catch (error) {
      setStatus("error");
      setMessage("Not found order");
      toggle();
      setLoading(false);
      return;
    }
    try {
      await cancelOrder(data.tokenId!);
      setTimeout(() => {
        setStatus("cancel-success");
        setMessage("Successfully canceled sale");
        toggle();
      }, 200);
    } catch (error) {
      setTimeout(() => {
        setStatus("error");
        setMessage("Not found order");
        toggle();
      }, 200);
    }
    setLoading(false);
  };

  const addPower = levelToPower[data.level];

  return (
    <Item>
      <div className="icon-hero">
        <HeroIcon
          data={data}
          heroType={isHeroS ? HeroType.s : (shieldData?.heroType as any)}
        />
      </div>
      <div className="info">
        <div className="level">Level {data.level}</div>
        <Tag>#{cancel ? data.tokenId : data.id}</Tag>
        <Tag className={mapTag[data.rarity]}>{mapRarity(data.rarity)} </Tag>
        <SuspiciousBadge flag={data.suspicious} />
      </div>
      <div>
        <div className="flex-skill">
          <div>
            <div className="title">POWER</div>
            <div className="skill">
              <IconSkill src="/icons/skill2.webp" />
              <span>
                {data.bombPower}
                {addPower !== 0 && <em className="add">(+{addPower})</em>}
              </span>
            </div>
          </div>
          <div>
            <div className="title">SPEED</div>
            <div className="skill">
              <IconSkill src="/icons/skill1.webp" />
              <span>{data.speed}</span>
            </div>
          </div>
          <div>
            <div className="title">STAMINA</div>
            <div className="skill">
              <IconSkill src="/icons/skill5.webp" />
              <span>{data.stamina}</span>
            </div>
          </div>
          <div>
            <div className="title">BOMB NUM</div>
            <div className="skill">
              <IconSkill src="/icons/skill3.webp" />
              <span>{data.bombCount}</span>
            </div>
          </div>
          <div>
            <div className="title">RANGE</div>
            <div className="skill">
              <IconSkill src="/icons/skill4.webp" />
              <span>{data.bombRange}</span>
            </div>
          </div>
          {(isHeroS || shieldData?.heroType === HeroType.lStake) && (
            <div>
              <div className="title">SHIELD</div>
              <div className="skill">
                <IconSkill src={"/icons/shield_lightning.png"} />
                <span>
                  {shieldData?.shieldAmount
                    ? shieldData?.shieldAmount
                    : `?/${mapRarityShield(data.rarity)}`}
                </span>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="text">STAKED</div>
          <div className="flex-skill">
            <div className="skill">
              <IconCoinStake src="/icons/token.png" />
              <span>{shieldData ? staked : "?"}</span>
            </div>
          </div>
          <div className="flex-skill">
            <div className="skill">
              <IconCoinStake src="/icons/sen_token.png" />
              <span>{shieldData ? stakedSen : "?"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="skill-item">
        {abilities
          .sort(function (a, b) {
            return a - b;
          })
          .map((element) => (
            <WrapSkill className="tooltip" key={element}>
              <IconItem
                key={element}
                src={"/skill/" + skills[element] + ".png"}
              />
              <span className="tooltiptext">
                {skillsDesc[parseInt(String(element))]}
              </span>
            </WrapSkill>
          ))}
        {(isHeroS || shieldData?.heroType === HeroType.lStake) && (
          <WrapSkill className="tooltip">
            <IconItem src="/skill/shield_icon.png" />
            <span className="tooltiptext">Immune to Thunder</span>
          </WrapSkill>
        )}
      </div>
      <div className="action">
        {cancel && (
          <React.Fragment>
            <div className="top">
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
        {!cancel && isApprove && isSellable && isThroughThe7DayRule && (
          <button onClick={sell}>
            <img src="/icons/sell.webp" alt="" /> SELL
          </button>
        )}
        {!cancel && isApprove && (!isSellable || !isThroughThe7DayRule) && (
          <button
            className="no-sell tooltip"
            onMouseLeave={() => {
              setMessage("This tier is not sellable at this time");
            }}
          >
            <span className="tooltiptext">
              {!isThroughThe7DayRule
                ? "The newly minted NFT must wait for 7 days to become sellable"
                : "This tier is not sellable at this time "}
            </span>
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
          data={{ ...data, id: data.id || data.tokenId || 0 }}
          hide={toggle}
          minPrice={minPrice}
          name={"BHero"}
          isShowing={isShowing}
        />
      )}
      {status === "success" && (
        <SellSuccess
          title="Bhero"
          data={data}
          hide={toggle}
          minPrice={minPrice}
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status === "fail" && (
        <SellFail
          data={data}
          hide={toggle}
          minPrice={minPrice}
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status === "cancel" && (
        <Cancel
          data={data}
          hide={toggle}
          confirm={funcCancel}
          message={"Are you sure you want to stop selling this hero?"}
          isShowing={isShowing}
        />
      )}
      {status === "error" && (
        <Error
          data={data}
          hide={toggle}
          message={message}
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status === "cancel-success" && (
        <Success
          id={data.tokenId || data.ref_id || data.id}
          hide={toggle}
          message={message}
          title="Cancel Bhero"
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
        <Error data={data} hide={toggle} message={message} />
      )}
    </Item>
  );
};

const Item = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 1.125rem 1.313rem;
  gap: 1rem;
  min-height: 12rem;
  border: solid 1px #343849;
  background-color: #191b24;
  .info {
    width: 12rem;
    flex-shrink: 0;
  }

  .icon-hero {
    flex-shrink: 0;
  }
  .uppercase {
    text-transform: uppercase;
  }
  .text {
    margin-top: 7px;
    font-size: 0.813rem;
    line-height: 1.31;
    color: #a6afd7;
    margin-bottom: 0.688rem;
  }
  .flex-skill {
    display: flex;
    flex-wrap: wrap;
    justify-content: left;
    column-gap: 0.5rem;
    row-gap: 0.5rem;
    & > div {
      min-width: 4rem;
      &.power {
        min-width: 5rem !important;
      }
    }

    .title {
      font-size: 0.813rem;
      line-height: 1.31;
      color: #a6afd7;
      margin-bottom: 0.688rem;
    }
  }
  .content-shield {
    flex-direction: column;
    display: flex;
    align-items: center;
  }
  .skill-item {
    display: flex;
    flex-wrap: wrap;
    row-gap: 0.5rem;
    justify-content: flex-end;
    flex: 1 1 0;
    min-width: 0;
    img {
      margin-right: 0.3rem;
    }
  }
  .skill {
    display: flex;
    align-items: center;
    span {
      font-size: 1.375rem;
      font-weight: 500;
      line-height: 1.3;
      color: #fff;
      margin-left: 0.5rem;
      display: inline-block;
    }
  }
  .shield {
    color: #fff;
    font-weight: 500;
    line-height: 1.8;
    /* display: inline-block; */
  }
  .action {
    display: flex;
    width: 14rem;
    flex-shrink: 0;
    justify-content: right;
    .top {
      display: flex;
      align-items: center;
    }

    img {
      width: 1.75rem;
      height: 2rem;
      object-fit: contain;
    }
    span {
      width: 5rem;
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
      width: 6rem;
      background: #ff0759;
      color: white;
      padding: 0.938rem 0.5rem 0.938rem 0.5rem;
    }
    &.approve {
      background-color: #e6903a !important;
      color: white;
      padding: 0.938rem 1.125rem;
    }
    // &.no-sell {
    //  opacity: 0.5;
    // }
    &.no-sell {
      background: #ff973aa6;
    }
    &.no-sell img {
      opacity: 0.5;
    }
    img {
      width: 1.75rem;
      height: 1.75rem;
      margin-right: 1.125rem;
    }
  }
`;

const WrapSkill = styled.div`
  position: relative;
  img {
    cursor: pointer;
  }
  &:hover {
    .tooltiptext {
      opacity: 1;
    }
  }
  .tooltiptext {
    position: absolute;
    opacity: 0;
  }
`;

export default React.memo(BHeroFullWidth);
