import React from "react";
import styled from "styled-components";
import { useContract } from "../../../context/smc";
import { useAccount } from "../../../context/account";
import { NavLink } from "react-router-dom";
import Copy from "../../common/copy";
import { minAddress, BcoinBalance, numberFormat } from "../../../utils/helper";
import { Dropdown } from "antd";
import { NETWORK_CONFIG } from "../../../utils/config";
import { convetChainIdToNetWork } from "../../Service/web3";
import arrow_dropdown from "../../../assets/images/arrow_dropdown.png";
import { NetworkType } from "../../../types/account";

const ButtonConnect = styled.button`
  height: 3.188rem;
  display: flex;
  align-items: center;
  background-color: #ff973a;
  padding: 0 1rem;
  border: none;
  box-shadow: none;
  font-size: 1.313rem;
  font-weight: bold;
  line-height: 1.14;
  color: #fff;
  cursor: pointer;
`;

const ButtonDropdown = styled.button`
  height: 3.188rem;
  width: 13rem;
  display: flex;
  align-items: center;
  background-color: #3a3f54;
  padding: 0 1rem;
  border: none;
  box-shadow: none;
  font-size: 1.313rem;
  font-weight: bold;
  line-height: 1.14;
  color: #fff;
  cursor: pointer;
  .icon {
    height: 1.938rem;
    flex: 0;
  }

  .arrow {
    flex: 0;
    height: 0.7rem;
  }

  .text {
    flex: 1;
  }
`;


const Account = styled.button`
  height: 3.188rem;
  display: flex;
  align-items: center;
  color: white;
  padding: 0 1.625rem 0 1.625rem;
  font-weight: bold;
  font-size: 1rem;
  transition: 0.3s ease-in-out;
  background: #ff973a;
  border: none;

  img {
    width: 1.688rem;
    height: 1.688rem;
    object-fit: contain;
    margin-right: 1rem;
  }
`;

const Wallet = styled.div`
  display: flex;
  height: 3.188rem;
  .token {
    width: 2.125rem;
    object-fit: cover;
  }
  .info {
    display: flex;
    align-items: center;
    padding: 0px 0.5rem;
    min-width: 10rem;
    .wallet {
      margin-left: 0.438rem;
      .b-coin {
        font-size: 0.938rem;
        font-weight: bold;
        color: #ffd998;
        line-height: 0.9;
      }
      .address {
        font-size: 0.938rem;
        font-weight: bold;
        color: #7a81a4;
        line-height: 0.9;
      }
    }
  }
  .address {
    display: flex;
    margin-right: 10px;
    align-items: center;
    color: #fff;
    svg {
      height: 1rem;
      margin-left: 0.5rem;
      fill: white;
    }
  }
`;


const ConnectWallet: React.FC = () => {
  const { connectWallet, doChangeNetwork } = useContract();
  const { auth, network, updateNetwork } = useAccount();
  let networkSelected = network === NETWORK_CONFIG[0].name ? NETWORK_CONFIG[0] : NETWORK_CONFIG[1];
  let networkToChange = network === NETWORK_CONFIG[0].name ? NETWORK_CONFIG[1] : NETWORK_CONFIG[0];

  const changeNetwork = () => {
    if (auth?.logged) {
      doChangeNetwork(networkToChange.chainId);
    } else {
      listenNetworkChange(networkToChange.chainId);
    }
  };

  const listenNetworkChange = (chainid: number) => {
    const networkValue = convetChainIdToNetWork(chainid);
    if (networkValue === NETWORK_CONFIG[0].name) {
      updateNetwork(NETWORK_CONFIG[0].name as NetworkType);
      return;
    }

    if (networkValue === NETWORK_CONFIG[1].name) {
      updateNetwork(NETWORK_CONFIG[1].name as NetworkType);
      return;
    }
  };

  const connectOnclick = async () => {
    await connectWallet();
  };

  const menuItems = [
    {
      key: "1",
      label: (
        <div style={{ display: "flex", alignItems: "center" }}>
          <img style={{ height: "1.938rem" }} src={networkToChange.urlIcon} alt="" />
          <span style={{ flex: 1, fontWeight: "bold", color: "#fff", fontSize: "1.313rem", lineHeight: "1.14", marginLeft: "2.5rem", textAlign: "center" }}>
            {networkToChange.name}
          </span>
        </div>
      ),
      onClick: changeNetwork,
    },
  ];

  if (!auth.logged)
    return (
      <div style={{ display: "flex" }}>
        <Dropdown
          menu={{ items: menuItems, style: { backgroundColor: "#3a3f54", width: "13rem", marginTop: "-4px" } }}
          placement="bottom"
          trigger={["click"]}
          overlayStyle={{ position: "fixed" }}
        >
          <ButtonDropdown>
            <img className="icon" src={networkSelected.urlIcon} alt="" />
            <div className="text">{networkSelected.name}</div>
            <img className="arrow" src={arrow_dropdown} alt="" />
          </ButtonDropdown>
        </Dropdown>
        <ButtonConnect onClick={connectOnclick}>
          <img src="./icons/login.webp" alt="" /> <span>Connect Wallet</span>
        </ButtonConnect>
      </div>
    );
  else
    return (
      <Wallet>
        <div className="info">
          <img
            className="token"
            src="/icons/sen_token.png"
            alt=""
          />
          <div className="wallet">
            <div className="b-coin">
              {numberFormat(
                BcoinBalance(
                  network === NETWORK_CONFIG[0].name
                    ? auth?.wallet?.sen
                    : auth?.wallet?.senMatic
                )
              )}{" "}
              SEN
            </div>
          </div>
        </div>
        <div className="info">
          <img className="token" src="/icons/token.png" alt="" />
          <div className="wallet">
            <div className="b-coin">
              {numberFormat(
                BcoinBalance(
                  network === NETWORK_CONFIG[0].name
                    ? auth.wallet.bcoin
                    : auth.wallet.bcoinMatic
                )
              )}{" "}
              BCOIN
            </div>
          </div>
        </div>
        <div className="address">
          <span>{minAddress(auth.address)}</span> <Copy data={auth.address} />
        </div>
        <Dropdown menu={{ items: menuItems, style: { backgroundColor: "#3a3f54", width: "13rem", marginTop: "-4px" } }} trigger={["click"]}>
          <ButtonDropdown>
            <img className="icon" src={networkSelected.urlIcon} alt="" />
            <div className="text">{networkSelected.name}</div>
            <img className="arrow" src={arrow_dropdown} alt="" />
          </ButtonDropdown>
        </Dropdown>
        <NavLink to="/account">
          <Account>
            <img src="/icons/account.webp" alt="" />
            <div> My Account </div>
          </Account>
        </NavLink>
      </Wallet>
    );
};

export default ConnectWallet;
