import React, { useState } from "react";
import styled from "styled-components";
import { useContract } from "../../../context/smc";
import { useAccount } from "../../../context/account";
import { useModal } from "../../modal";
import Error from "../../modal/buy-error";
import BuySuccess from "../../modal/buy-success";
import axios from "axios";
import { NETWORK, SmartContracts } from "../../../utils/config";
import { getAPI } from "../../../utils/helper";
import SuspiciousConfirm from "../../modal/suspicious-confirm";
import { SuspiciousFlag } from "../../../types/hero";

const ButtonBuy = styled.div`
  padding: 0.938rem 2.125rem;
  font-size: 1.125rem;
  color: #381a09;
  box-sizing: border-box;
  line-height: 1;
  cursor: pointer;
  font-weight: 700;
  border-radius: var(--radius-sm, 6px);
  background-color: var(--accent, #ff973a);
  border: none;
  box-shadow: 0 4px 12px rgba(255, 151, 58, 0.25);
  max-width: 6.688rem;
  transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out,
    background-color 0.15s ease-in-out;

  &:hover {
    background-color: var(--accent-hover, #ffab5e);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 151, 58, 0.35);
  }

  &.disable {
    border: solid 2px var(--border-strong, #3f4564);
    color: var(--text-muted, #8d95b7);
    background: none;
    box-shadow: none;
    cursor: not-allowed;
  }
  &.disable:hover {
    transform: none;
    box-shadow: none;
  }
`;

const friendlyBuyError = (error: any): string => {
  const raw: string =
    error?.reason ||
    error?.shortMessage ||
    error?.info?.error?.message ||
    error?.data?.message ||
    error?.message ||
    "";
  const lc = raw.toLowerCase();
  if (lc.includes("invalid token id"))
    return "This hero no longer exists (it has been burned). The listing is no longer valid.";
  if (lc.includes("order not existed"))
    return "This order no longer exists. It may have been sold or cancelled.";
  if (lc.includes("price is not match"))
    return "The price has changed. Please refresh the page and try again.";
  if (lc.includes("approveforall"))
    return "The seller has not approved the marketplace for this NFT.";
  if (lc.includes("insufficient") || lc.includes("transfer amount exceeds balance"))
    return "You don't have enough balance to complete this purchase.";
  if (error?.code === "ACTION_REJECTED" || lc.includes("user rejected"))
    return "You rejected the transaction.";
  return raw || "Buy order failed";
};

interface HeroData {
  isToken?: string;
  suspicious?: SuspiciousFlag | null;
  seller_wallet_address?: string;
  rarity?: number;
  abilities?: number[];
  amount?: string | number | bigint;
  bomb_power?: number;
  bomb_range?: number;
  stamina?: number;
  speed?: number;
  bomb_count?: number;
}

interface ButtonProps {
  data: HeroData;
  price: string | number | bigint;
  id: string | number;
  fetchData?: () => void;
}

const Button: React.FC<ButtonProps> = ({ data, price, id, fetchData }) => {
  const { isShowing, toggle } = useModal();
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { auth, clear, network } = useAccount();
  let isUsePolygon = network === NETWORK.POLYGON;
  let _bcoin =
    auth.logged &&
    BigInt(isUsePolygon ? (auth.wallet.bcoinMatic || "0") : (auth.wallet.bcoin || "0"));
  let _sen =
    auth.logged &&
    BigInt(isUsePolygon ? (auth.wallet.senMatic || "0") : (auth.wallet.sen || "0"));
  const _price = auth.logged && BigInt(price);
  let senContract = isUsePolygon ? SmartContracts.senMatic : SmartContracts.sen;
  let isAllow: boolean | undefined;
  const {
    getOrder,
    setLoading,
    BcoinAllowance,
    BcoinApprove,
    buyHero,
    getBHeroDetail,
    updateBcoin,
    wasHeroBurn,
    SenAllowance,
    SenApprove,
  } = useContract();

  const burnHero = async () => {
    try {
      let baseUrl = getAPI(network);
      await axios.post(baseUrl + "transactions/heroes/burn/" + id);
    } catch (error) {
      // silent error
    }
  };

  if (
    auth.logged &&
    _bcoin !== false &&
    _sen !== false &&
    _price !== false &&
    ((data.isToken != senContract.address &&
      parseFloat(_bcoin.toString()) >= parseFloat(_price.toString())) ||
      (data.isToken == senContract.address &&
        parseFloat(_sen.toString()) >= parseFloat(_price.toString())))
  ) {
    isAllow = true;
  }

  // Heroes on the suspicious list need an explicit acknowledgement first
  const onClick = (item: HeroData) => {
    if (!isAllow) return;
    if (item?.suspicious) {
      setConfirming(true);
      return;
    }
    proceedBuy(item);
  };

  const confirmSuspicious = () => {
    setConfirming(false);
    proceedBuy(data);
  };

  const proceedBuy = async (item: HeroData) => {
    if (
      item?.isToken == senContract.address &&
      _sen !== false &&
      parseFloat(_sen.toString()) < parseFloat(String(item.amount))
    ) {
      setStatus("notenoughtsen");
      toggle();
      return;
    }
    if (
      item?.isToken != senContract.address &&
      _bcoin !== false &&
      parseFloat(_bcoin.toString()) < parseFloat(String(item.amount))
    ) {
      setStatus("notenought");
      toggle();
      return;
    }

    setLoading(true);
    if (fetchData) fetchData();

    try {
      const hero = await getBHeroDetail();
      if (hero.length > 499) {
        setStatus("exceedthepurchasinglimit");
        toggle();
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error(error);
      setStatus("cantgetbhero");
      toggle();
      setLoading(false);
      return;
    }

    try {
      await getOrder(id);
    } catch (error) {
      setStatus("notfound");
      toggle();
      setLoading(false);
      return;
    }

    const heroStillExists = await wasHeroBurn(id);
    if (!heroStillExists) {
      setErrorMessage(
        "This hero no longer exists (it has been burned). The listing is no longer valid."
      );
      setStatus("failed");
      toggle();
      setLoading(false);
      return;
    }

    const isAllowed =
      item?.isToken == senContract.address
        ? await SenAllowance()
        : await BcoinAllowance();

    const isApprove_price =
      BigInt(isAllowed.toString()) - BigInt(price.toString());

    const isCannotBuy = isApprove_price < 0n;
    if (isCannotBuy) {
      try {
        setLoading(true);
        if (item?.isToken == senContract.address) {
          await SenApprove();
        } else {
          console.log("call BcoinApprove");
          await BcoinApprove();
        }
      } catch (error) {
        console.error("call BcoinApprove error", error);
        setStatus("notapprove");
        toggle();
        setLoading(false);
        return;
      }

      let isAllowed =
        item?.isToken == senContract.address
          ? await SenAllowance()
          : await BcoinAllowance();
      const isApprove_price =
        BigInt(isAllowed.toString()) - BigInt(price.toString());
      const isCannotBuy = isApprove_price < 0n;
      if (isCannotBuy) {
        setLoading(false);
        return;
      }
      await buy();
    } else {
      await buy();
    }
    setLoading(false);
  };

  const buy = async () => {
    try {
      await buyHero(id, String(price));
      await updateBcoin();
      setStatus("success");
    } catch (error) {
      console.error("buyHero failed:", error);
      setErrorMessage(friendlyBuyError(error));
      setStatus("failed");
    }
    toggle();
  };

  return (
    <React.Fragment>
      <ButtonBuy
        className={!isAllow ? "bcoin-btn disable" : "bcoin-btn"}
        onClick={() => onClick(data)}
      >
        Buy
      </ButtonBuy>
      {confirming && data.suspicious && (
        <SuspiciousConfirm
          flag={data.suspicious}
          tokenId={id}
          hide={() => setConfirming(false)}
          confirm={confirmSuspicious}
          isShowing={confirming}
        />
      )}
      {status == "notfound" && (
        <Error
          message="The assets is no longer on the market because it has been sold or the seller has canceled the sale"
          hide={toggle}
          id={id}
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status == "exceedthepurchasinglimit" && (
        <Error
          message="You're limited to buy more Bhero"
          hide={toggle}
          id={id}
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status == "cantgetbhero" && (
        <Error
          message="Can't get Bhero, please try again!"
          hide={toggle}
          id={id}
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status == "notenought" && (
        <Error
          message="You don't have enough bcoin "
          hide={toggle}
          id={id}
          isShowing={isShowing}
        />
      )}
      {status == "notenoughtsen" && (
        <Error
          message="You don't have enough sen "
          hide={toggle}
          id={id}
          isShowing={isShowing}
        />
      )}
      {status == "success" && (
        <BuySuccess
          hide={toggle}
          id={id}
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status == "notapprove" && (
        <Error
          message="You are not approve"
          hide={toggle}
          id={id}
          isShowing={isShowing}
        />
      )}
      {status == "failed" && (
        <Error
          message={errorMessage || "Buy order failed"}
          hide={toggle}
          id={id}
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
    </React.Fragment>
  );
};

export default Button;
