import React, { useState } from "react";
import styled from "styled-components";
import { useContract } from "../../../context/smc";
import { useAccount } from "../../../context/account";
import { useModal } from "../../modal";
import Error from "../../modal/buy-error";
import BuySuccess from "../../modal/buy-success";
import { NETWORK_CONFIG, SmartContracts } from "../../../utils/config";

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

interface HouseData {
  isToken?: string;
  seller_wallet_address?: string;
  rarity?: number;
  amount?: string | number | bigint;
}

interface ButtonProps {
  data: HouseData;
  price: string | number | bigint;
  id: string | number;
  reload?: () => void;
}

const Button: React.FC<ButtonProps> = ({ data, price, id }) => {
  const { isShowing, toggle } = useModal();
  const [status, setStatus] = useState("");

  const {
    setLoading,
    BcoinAllowanceBhouse,
    BcoinApproveBhouse,
    buyOrderBhouse,
    getOrderBhouse,
    getBHouseDetail,
    updateBcoin,
    SenAllowanceBhouse,
    SenApproveBhouse,
  } = useContract();

  const { auth, clear, network } = useAccount();
  let isUsePolygon = network === NETWORK_CONFIG[1].name;
  let _bcoin =
    auth.logged &&
    BigInt(isUsePolygon ? (auth.wallet.bcoinMatic || "0") : (auth.wallet.bcoin || "0"));
  let _sen =
    auth.logged &&
    BigInt(isUsePolygon ? (auth.wallet.senMatic || "0") : (auth.wallet.sen || "0"));
  const _price = auth.logged && BigInt(price);
  let senContract = isUsePolygon
    ? SmartContracts.senMatic
    : SmartContracts.sen;
  let isAllow: boolean | undefined;

  if (
    (auth.logged &&
      _bcoin !== false &&
      _price !== false &&
      parseFloat(_bcoin.toString()) >= parseFloat(_price.toString())) ||
    (data.isToken === senContract.address &&
      _sen !== false &&
      _price !== false &&
      parseFloat(_sen.toString()) >= parseFloat(_price.toString()))
  ) {
    isAllow = true;
  }

  const onClick = async (item: HouseData) => {
    if (!isAllow) return;
    if (
      item?.isToken === senContract.address &&
      _sen !== false &&
      parseFloat(_sen.toString()) < parseFloat(String(item.amount))
    ) {
      setStatus("notenoughtsen");
      toggle();
      return;
    }
    if (
      item?.isToken !== senContract.address &&
      _bcoin !== false &&
      parseFloat(_bcoin.toString()) < parseFloat(String(item.amount))
    ) {
      setStatus("notenought");
      toggle();
      return;
    }
    setLoading(true);

    try {
      const houses = await getBHouseDetail();
      if (houses.length > 4) {
        setStatus("exceedthepurchasinglimit");
        toggle();
        setLoading(false);
        return;
      }
    } catch (error) {
      setStatus("cantgetbhouse");
      toggle();
      setLoading(false);
      return;
    }

    try {
      await getOrderBhouse(id);
    } catch (error) {
      setStatus("notfound");
      toggle();
      setLoading(false);
      return;
    }

    const isAllowed =
      item?.isToken === senContract.address
        ? await SenAllowanceBhouse()
        : await BcoinAllowanceBhouse();

    const isApprove_price =
      BigInt(isAllowed.toString()) - BigInt(price.toString());

    const isCannotBuy = isApprove_price < 0n;
    if (isCannotBuy) {
      try {
        setLoading(true);
        if (item?.isToken === senContract.address) {
          await SenApproveBhouse();
        } else {
          await BcoinApproveBhouse();
        }
      } catch (error) {
        setStatus("notapprove");
        toggle();
        setLoading(false);
        return;
      }

      let isAllowed =
        item?.isToken === senContract.address
          ? await SenAllowanceBhouse()
          : await BcoinAllowanceBhouse();

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
      await buyOrderBhouse(id, String(price));
      await updateBcoin();
      setStatus("success");
      toggle();
    } catch (error) {
      console.log(error);
      setStatus("failed");
      toggle();
    }
    setLoading(false);
  };

  return (
    <React.Fragment>
      <ButtonBuy
        className={!isAllow ? "disable" : ""}
        onClick={() => onClick(data)}
      >
        Buy
      </ButtonBuy>
      {status === "notfound" && (
        <Error
          message="The assets is no longer on the market because it has been sold or the seller has canceled the sale"
          hide={toggle}
          id={id}
          bType="Bhouse"
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status === "exceedthepurchasinglimit" && (
        <Error
          message="You're limited to buy more Bhouse"
          hide={toggle}
          id={id}
          bType="Bhouse"
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status === "cantgetbhouse" && (
        <Error
          message="Can't get Bhouse, please try again"
          hide={toggle}
          id={id}
          bType="Bhouse"
          reload={clear.current}
          isShowing={isShowing}
        />
      )}
      {status === "notenought" && (
        <Error
          message="You don't have enough bcoin "
          hide={toggle}
          id={id}
          bType="Bhouse"
          isShowing={isShowing}
        />
      )}
      {status === "notenoughtsen" && (
        <Error
          message="You don't have enough sen "
          hide={toggle}
          id={id}
          isShowing={isShowing}
        />
      )}
      {status === "success" && (
        <BuySuccess
          hide={toggle}
          id={id}
          reload={clear.current}
          bType="Bhouse"
          isShowing={isShowing}
        />
      )}
      {status === "notapprove" && (
        <Error
          message="You are not approve"
          hide={toggle}
          id={id}
          bType="Bhouse"
          isShowing={isShowing}
        />
      )}
      {status === "failed" && (
        <Error
          message="Buy order failed"
          hide={toggle}
          id={id}
          reload={clear.current}
          bType="Bhouse"
          isShowing={isShowing}
        />
      )}{" "}
    </React.Fragment>
  );
};

export default Button;
