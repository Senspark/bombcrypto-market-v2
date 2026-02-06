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
import { useCart } from "../../../context/cart";

const ButtonBuy = styled.div`
  padding: 0.938rem 2.125rem;
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
  max-width: 6.688rem;

  &.disable {
    border: solid 2px #3f4564;
    color: #8d95b7;
    background: none;
  }
`;

interface HeroData {
  isToken?: string;
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
  const { addToCart, isInCart } = useCart();
  const { isShowing, toggle } = useModal();
  const [status, setStatus] = useState("");
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

  const onClick = async (item: HeroData) => {
    if (!isAllow) return;
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
      setStatus("failed");
    }
    toggle();
  };

  return (
    <React.Fragment>
      <div style={{ display: "flex" }}>
        <ButtonBuy
          className={!isAllow ? "bcoin-btn disable" : "bcoin-btn"}
          onClick={() => onClick(data)}
        >
          Buy
        </ButtonBuy>
        <ButtonBuy
          className={isInCart(id) ? "bcoin-btn disable" : "bcoin-btn"}
          style={{
            marginLeft: "10px",
            backgroundColor: isInCart(id) ? "transparent" : "#3f4564",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isInCart(id)) {
              addToCart({
                id: id,
                price: String(price),
                tokenAddress: data.isToken || "",
                data: data,
              });
            }
          }}
        >
          {isInCart(id) ? "Added" : "+ Cart"}
        </ButtonBuy>
      </div>
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
          message="Buy order failed"
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
