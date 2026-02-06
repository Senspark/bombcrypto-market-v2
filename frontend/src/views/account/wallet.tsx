import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { TitleAgency } from "../../components/common/style";
import { BcoinBalance, minAddress, numberFormat } from "../../utils/helper";
import { useAccount } from "../../context/account";
import { useContract } from "../../context/smc";
import History from "../../components/partial/history";
import Copy from "../../components/common/copy";
import { NETWORK_CONFIG } from "../../utils/config";

interface WalletState {
  hero: number;
  house: number;
}

const Wallet: React.FC = () => {
  const { auth, network } = useAccount();
  const isUsePolygon = network === NETWORK_CONFIG[1].name;
  const [state, setstate] = useState<WalletState>({ hero: 0, house: 0 });

  const { getBHeroDetail, getBHouseDetail } = useContract();
  const getInfo = async () => {
    const hero = await getBHeroDetail();
    const house = await getBHouseDetail();
    setstate({
      hero: hero.length,
      house: house.length,
    });
  };

  useEffect(() => {
    getInfo();
  }, [isUsePolygon]);

  return (
    <WalletWrap>
      <TitleAgency>Wallet</TitleAgency>
      <WalletBox>
        <Item>
          <div className="image">
            <img src="/icons/sen_token.png" alt="" />
          </div>
          <div className="total-price">
            {numberFormat(
              BcoinBalance(
                isUsePolygon ? auth?.wallet?.senMatic : auth?.wallet?.sen
              )
            )}
          </div>
        </Item>
        <Item>
          <div className="image">
            <img src="/icons/token.png" alt="" />
          </div>
          <div className="total-price">
            {numberFormat(
              BcoinBalance(
                isUsePolygon ? auth?.wallet?.bcoinMatic : auth?.wallet?.bcoin
              )
            )}
          </div>
        </Item>
        <Item>
          <div className="image">
            <img src="/icons/wallet-hero.webp" alt="" />
          </div>
          <div>{state.hero}</div>
        </Item>
        <Item>
          <div className="image">
            <img src="/icons/bhouse.webp" alt="" />
          </div>

          <div>{state.house}</div>
        </Item>
        <Item>
          <div className="image">
            <img src="/icons/bed.webp" alt="" />
          </div>
          <div>-- iTEM</div>
          <p>Coming Soon</p>
        </Item>
      </WalletBox>
      <Address>
        <div className="wallet">
          <div className="address">
            {minAddress(auth.address)} <Copy data={auth.address} />
          </div>
        </div>
      </Address>
      <TitleAgency>Activities</TitleAgency>
      <History />
    </WalletWrap>
  );
};

export default Wallet;

const WalletWrap = styled.div`
  flex: 1;
  padding: 3.188rem 2.563rem;
  .total-price {
    min-width: 10rem;
  }
`;

const WalletBox = styled.div`
  padding: 2.75rem 18.125rem;
  margin-top: 1.625rem;
  display: flex;
  justify-content: space-between;
  border-radius: 5px;
  border: solid 1px #565b78;
  background-color: #2c2f3f;
`;

const Item = styled.div`
  .image {
    display: flex;
    justify-content: center;
  }
  img {
    width: 6rem;
    height: 6rem;
    object-fit: contain;
  }
  div {
    margin-top: 1.875rem;
    text-align: center;
    font-size: 1.656rem;
    font-weight: 500;
    line-height: 1.32;
    color: #fff;
  }
  p {
    font-size: 1.313rem;
    font-weight: 500;
    line-height: 1.33;
    color: #5d6381;
  }
`;

const Address = styled.div`
  flex: 1;
  padding: 1.125rem 2.75rem;
  border-radius: 0 0 5px 5px;
  border: solid 1px #565b78;
  border-top: none;
  background-color: #20222e;
  margin-bottom: 3.75rem;
  .wallet {
    margin-left: 0.438rem;
    font-size: 0.938rem;
    font-weight: bold;
    color: #7a81a4;
    line-height: 0.9;
    .address {
      display: flex;
      align-items: center;
      .icon {
        margin-left: 0.5rem;
      }
    }
  }
`;
