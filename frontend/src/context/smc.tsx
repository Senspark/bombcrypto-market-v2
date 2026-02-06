import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ChainId, NETWORK, RPC_BSC, SmartContracts } from "../utils/config";
import { BoxLoading } from "react-loadingg";
import { BrowserProvider, Contract, JsonRpcProvider, parseEther, Signer, ContractTransactionReceipt, Block } from "ethers";
import {
  changeNetwork,
  convetChainIdToNetWork,
  getBalance,
  onListenNetworkChange,
  TokenName,
} from "../components/Service/web3";
import Web3Modal from "web3modal";
import { useAccount } from "./account";
import { providerOptions } from "../providerOptions";
import { NetworkType } from "../types/account";

export interface Web3ContextValue {
  connectWallet: () => Promise<void>;
  getBalance: typeof getBalance;
  getBHeroDetail: () => Promise<any>;
  isApprovedForAll: () => Promise<boolean | null>;
  setApprovalForAll: () => Promise<void>;
  createOrder: (id: number | string, price: string, tokenAddress: string) => Promise<string>;
  cancelOrder: (id: number | string) => Promise<void>;
  buyOrder: (id: number | string, price: string) => Promise<void>;
  getOrder: (id: number | string) => Promise<any>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  BcoinAllowance: () => Promise<string>;
  BcoinApprove: () => Promise<void>;
  buyHero: (id: number | string, price: string) => Promise<ContractTransactionReceipt | null>;
  batchBuyHero: (ids: (number | string)[], prices: string[]) => Promise<ContractTransactionReceipt | null>;
  address: string;
  updateBcoin: () => Promise<any>;
  wasHeroBurn: (id: number | string) => Promise<boolean>;

  createOrderBhouse: (id: number | string, price: string, tokenAddress: string) => Promise<string>;
  buyOrderBhouse: (id: number | string, price: string) => Promise<ContractTransactionReceipt | null>;
  cancelOrderBhouse: (id: number | string) => Promise<void>;
  isApprovedForAllBhouse: () => Promise<boolean | null>;
  setApprovalForAllBhouse: () => Promise<void>;
  getBHouseDetail: () => Promise<any>;
  getOrderBhouse: (id: number | string) => Promise<any>;
  BcoinApproveBhouse: (price?: string) => Promise<void>;
  getBHouse: () => Promise<string | number>;
  BcoinAllowanceBhouse: () => Promise<string>;
  SenAllowanceBhouse: () => Promise<string>;
  SenApproveBhouse: () => Promise<void>;

  getBlockLatest: () => Promise<Block | null>;
  block: number | null;
  getTokenPayList: (tokenId: number | string) => Promise<any>;
  getHousePayList: (tokenId: number | string) => Promise<any>;
  SenApprove: () => Promise<void>;
  SenAllowance: () => Promise<string>;
  doChangeNetwork: (chainId: number) => Promise<void>;
}

export const contextWeb3 = createContext<Web3ContextValue | undefined>(undefined);

export const newWeb3Modal = new Web3Modal({
  network: "mainnet",
  cacheProvider: true,
  providerOptions,
  theme: "dark",
});

let address = "";
let InstanceBcoin: Contract | null = null;
let InstanceBhero: Contract | null = null;
let InstanceHeroMarket: Contract | null = null;
let InstanceBHouse: Contract | null = null;
let InstancenHouseMarket: Contract | null = null;
let InstanceProvider: BrowserProvider | null = null;
let InstanceSigner: Signer | null = null;
let InstanceSen: Contract | null = null;
let block: number | null = null;

interface ContractProviderProps {
  children: ReactNode;
  type?: string;
}

function Contract_({ children, type }: ContractProviderProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [initLoad, setInitLoad] = useState(false);
  const { auth, setAuth, updateWallet, network, updateNetwork } = useAccount();
  const isUsePolygon = network === NETWORK.POLYGON;
  const bcoin = isUsePolygon ? SmartContracts.bcoinMatic : SmartContracts.bcoin;
  const bhero = isUsePolygon ? SmartContracts.bheroMatic : SmartContracts.bhero;
  const bheromarket = isUsePolygon
    ? SmartContracts.bheromarketMatic
    : SmartContracts.bheromarket;
  const bhouse = isUsePolygon
    ? SmartContracts.bhouseMatic
    : SmartContracts.bhouse;
  const bhousemarket = isUsePolygon
    ? SmartContracts.bhousemarketMatic
    : SmartContracts.bhousemarket;
  const sen = isUsePolygon ? SmartContracts.senMatic : SmartContracts.sen;
  const networkSelected = isUsePolygon ? ChainId.Polygon : ChainId.BNB;

  useEffect(() => {
    const logged = window.localStorage.getItem("logged");
    if (logged === "true" && !initLoad) {
      connectWallet();
      setInitLoad(true);
    } else {
      setInitLoad(true);
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async () => {
        window.location.reload();
      });
      onListenNetworkChange(listenNetworkChange);
    }
  }, [initLoad]);

  useEffect(() => {
    changeNetworkListener();
  }, [network]);

  const mapSMCtoEthers = async (signer: Signer): Promise<void> => {
    InstanceBcoin = new Contract(bcoin.address, bcoin.abi, signer);
    InstanceBhero = new Contract(bhero.address, bhero.abi, signer);
    InstanceHeroMarket = new Contract(bheromarket.address, bheromarket.abi, signer);
    InstanceBHouse = new Contract(bhouse.address, bhouse.abi, signer);
    InstancenHouseMarket = new Contract(bhousemarket.address, bhousemarket.abi, signer);
    InstanceSen = new Contract(sen.address, sen.abi, signer);
  };

  const connectWallet = async (): Promise<void> => {
    try {
      const modalProvider = await newWeb3Modal.connect();
      const provider = new BrowserProvider(modalProvider);
      setLoading(true);
      InstanceProvider = provider;
      const signer = await provider.getSigner();
      InstanceSigner = signer;
      address = await signer.getAddress();
      await mapSMCtoEthers(signer);
      const token = await getAllBalance();
      window.localStorage.setItem("logged", "true");
      const latestBlock = await getBlockLatest();
      block = latestBlock?.number ?? null;
      setAuth({
        wallet: {
          bcoin: String(token.bcoin),
          sen: String(token.sen),
          bcoinMatic: String(token.bcoinMatic),
          senMatic: String(token.senMatic),
        },
        address: address,
        logged: true,
      });
      const chainId = Number(window.ethereum?.networkVersion);
      if (chainId == ChainId.Polygon || chainId == ChainId.BNB) {
        if (chainId == ChainId.Polygon) {
          listenNetworkChange(String(chainId));
        }
      } else {
        await doChangeNetwork(networkSelected);
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const listenNetworkChange = (chainid: string): void => {
    const networkValue = convetChainIdToNetWork(Number(chainid));
    if (networkValue != "") {
      updateNetwork(networkValue as NetworkType);
    }
  };

  const wasHeroBurn = async (id: number | string): Promise<boolean> => {
    try {
      await InstanceBhero?.ownerOf(id);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const isApprovedForAll = async (): Promise<boolean | null> => {
    let result = null;
    try {
      result = await InstanceBhero?.isApprovedForAll(address, bheromarket.address);
    } catch (error) {
      console.log(error);
    }
    return result;
  };

  const doChangeNetwork = async (chainId: number): Promise<void> => {
    if (loading) {
      return;
    }
    setLoading(true);
    await changeNetwork(chainId);
    setLoading(false);
  };

  const setApprovalForAll = async (): Promise<void> => {
    const tx = await InstanceBhero?.setApprovalForAll(bheromarket.address, true);
    await tx?.wait();
  };

  const getBlockLatest = async (): Promise<Block | null> => {
    return await InstanceProvider?.getBlock("latest") ?? null;
  };

  const createOrder = async (id: number | string, price: string, tokenAddress: string): Promise<string> => {
    setLoading(true);
    const result = parseEther(price);
    try {
      const tx = await InstanceHeroMarket?.createOrder(id, result.toString(), tokenAddress);
      await tx?.wait();
      setLoading(false);
      return "success";
    } catch (error) {
      setLoading(false);
      return "fail";
    }
  };

  const buyOrder = async (id: number | string, price: string): Promise<void> => {
    const price_BN = BigInt(price).toString();
    const tx = await InstanceHeroMarket?.buy(id, price_BN);
    await tx?.wait();
  };

  const cancelOrder = async (id: number | string): Promise<void> => {
    const tx = await InstanceHeroMarket?.cancelOrder(id);
    await tx?.wait();
  };

  const getOrder = async (id: number | string): Promise<any> => {
    return await InstanceHeroMarket?.getOrder(id);
  };

  const BcoinAllowance = async (): Promise<string> => {
    const result = await InstanceBcoin?.allowance(address, bheromarket.address);
    return result?.toString() ?? "0";
  };

  const SenAllowance = async (): Promise<string> => {
    const result = await InstanceSen?.allowance(address, bheromarket.address);
    return result?.toString() ?? "0";
  };

  const BcoinApprove = async (): Promise<void> => {
    const approve_amount = "1000000000000000000000000";
    const tx = await InstanceBcoin?.approve(bheromarket.address, approve_amount);
    await tx?.wait();
  };

  const SenApprove = async (): Promise<void> => {
    const approve_amount = "1000000000000000000000000";
    const tx = await InstanceSen?.approve(bheromarket.address, approve_amount);
    await tx?.wait();
  };

  const buyHero = async (id: number | string, price: string): Promise<ContractTransactionReceipt | null> => {
    const price_BN = BigInt(price).toString();
    const tx = await InstanceHeroMarket?.buy(id, price_BN);
    const result = await tx?.wait();
    return result ?? null;
  };

  const batchBuyHero = async (ids: (number | string)[], prices: string[]): Promise<ContractTransactionReceipt | null> => {
    const prices_BN = prices.map(p => BigInt(p).toString());
    const tx = await InstanceHeroMarket?.batchBuy(ids, prices_BN);
    const result = await tx?.wait();
    return result ?? null;
  };

  const getBHeroDetail = async (): Promise<any> => {
    InstanceBhero = new Contract(bhero.address, bhero.abi, InstanceSigner!);
    const result = await InstanceBhero.getTokenDetailsByOwner(address);
    return result;
  };

  const getBHouseDetail = async (): Promise<any> => {
    InstanceBHouse = new Contract(bhouse.address, bhouse.abi, InstanceSigner!);
    const result = await InstanceBHouse.getTokenDetailsByOwner(address);
    return result;
  };

  const getAllBalance = async (): Promise<{
    bcoin: string | number;
    sen: string | number;
    bcoinMatic: string | number;
    senMatic: string | number;
  }> => {
    let bcoinVal: string | number = 0;
    let bcoinMatic: string | number = 0;
    let senVal: string | number = 0;
    let senMatic: string | number = 0;
    try {
      bcoinVal = await getBalance(TokenName.Bcoin);
      bcoinMatic = await getBalance(TokenName.Bomb);
      senVal = await getBalance(TokenName.Sen);
      senMatic = await getBalance(TokenName.SenPolygon);
      return { bcoin: bcoinVal, sen: senVal, bcoinMatic, senMatic };
    } catch (error) {
      console.log(error);
    }
    return { bcoin: bcoinVal, sen: senVal, bcoinMatic, senMatic };
  };

  const getBHouse = async (): Promise<string | number> => {
    let result: string | number = 0;
    try {
      result = await InstanceBHouse?.balanceOf(address);
      return result?.toString() ?? 0;
    } catch (error) {
      console.log(error);
    }
    return result;
  };

  const BcoinAllowanceBhouse = async (): Promise<string> => {
    const result = await InstanceBcoin?.allowance(address, bhousemarket.address);
    return result?.toString() ?? "0";
  };

  const SenAllowanceBhouse = async (): Promise<string> => {
    const result = await InstanceSen?.allowance(address, bhousemarket.address);
    return result?.toString() ?? "0";
  };

  const createOrderBhouse = async (id: number | string, price: string, tokenAddress: string): Promise<string> => {
    setLoading(true);
    const result = parseEther(price);
    try {
      const tx = await InstancenHouseMarket?.createOrder(id, result.toString(), tokenAddress);
      await tx?.wait();
      setLoading(false);
      return "success";
    } catch (error) {
      console.log(error);
      setLoading(false);
      return "fail";
    }
  };

  const buyOrderBhouse = async (id: number | string, price: string): Promise<ContractTransactionReceipt | null> => {
    const price_BN = BigInt(price).toString();
    const tx = await InstancenHouseMarket?.buy(id, price_BN);
    const result = await tx?.wait();
    return result ?? null;
  };

  const cancelOrderBhouse = async (id: number | string): Promise<void> => {
    const tx = await InstancenHouseMarket?.cancelOrder(id);
    await tx?.wait();
  };

  const isApprovedForAllBhouse = async (): Promise<boolean | null> => {
    let result = null;
    try {
      result = await InstanceBHouse?.isApprovedForAll(address, bhousemarket.address);
    } catch (error) {
      console.log(error);
    }
    return result;
  };

  const setApprovalForAllBhouse = async (): Promise<void> => {
    const tx = await InstanceBHouse?.setApprovalForAll(bhousemarket.address, true);
    await tx?.wait();
  };

  const getOrderBhouse = async (id: number | string): Promise<any> => {
    return await InstancenHouseMarket?.getOrder(id);
  };

  const BcoinApproveBhouse = async (price?: string): Promise<void> => {
    const approve_amount = "1000000000000000000000000";
    const tx = await InstanceBcoin?.approve(bhousemarket.address, approve_amount);
    await tx?.wait();
  };

  const SenApproveBhouse = async (): Promise<void> => {
    const approve_amount = "1000000000000000000000000";
    const tx = await InstanceSen?.approve(bhousemarket.address, approve_amount);
    await tx?.wait();
  };

  const updateBcoin = async (): Promise<any> => {
    const token = await getAllBalance();
    updateWallet(
      String(token.bcoin),
      String(token.sen),
      String(token.bcoinMatic),
      String(token.senMatic)
    );
    return bcoin;
  };

  const changeNetworkListener = async (): Promise<void> => {
    if (auth?.logged && window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        InstanceProvider = provider;
        const signer = await provider.getSigner();
        InstanceSigner = signer;
        await mapSMCtoEthers(signer);
      } catch (error) {
        console.error("changeNetworkListener error:", error);
      }
    }
  };

  const getTokenPayList = async (tokenId: number | string): Promise<any> => {
    const provider = new JsonRpcProvider(isUsePolygon ? RPC_BSC.Polygon : RPC_BSC.BNB);
    const contract = new Contract(bheromarket.address, bheromarket.abi, provider);
    const listTokenPay = await contract.getTokenPayList(tokenId);
    return listTokenPay;
  };

  const getHousePayList = async (tokenId: number | string): Promise<any> => {
    const provider = new JsonRpcProvider(isUsePolygon ? RPC_BSC.Polygon : RPC_BSC.BNB);
    const contract = new Contract(bhousemarket.address, bhousemarket.abi, provider);
    const listTokenPay = await contract.getTokenPayList(tokenId);
    return listTokenPay;
  };

  const value: Web3ContextValue = {
    connectWallet,
    getBalance,
    getBHeroDetail,
    isApprovedForAll,
    setApprovalForAll,
    createOrder,
    cancelOrder,
    buyOrder,
    getOrder,
    setLoading,
    BcoinAllowance,
    BcoinApprove,
    buyHero,
    batchBuyHero,
    address,
    updateBcoin,
    wasHeroBurn,

    createOrderBhouse,
    buyOrderBhouse,
    cancelOrderBhouse,
    isApprovedForAllBhouse,
    setApprovalForAllBhouse,
    getBHouseDetail,
    getOrderBhouse,
    BcoinApproveBhouse,
    getBHouse,
    BcoinAllowanceBhouse,
    SenAllowanceBhouse,
    SenApproveBhouse,

    getBlockLatest,
    block,
    getTokenPayList,
    getHousePayList,
    SenApprove,
    SenAllowance,
    doChangeNetwork,
  };

  return (
    <contextWeb3.Provider value={value}>
      <React.Fragment key="content">
        {initLoad && children}
      </React.Fragment>
      {loading && (
        <div key="loading" className="loading">
          <BoxLoading size="large" color="#ff973a" />
        </div>
      )}
    </contextWeb3.Provider>
  );
}

export const useContract = (): Web3ContextValue => {
  const value = useContext(contextWeb3);
  if (!value) {
    throw new Error("useContract must be used within a ContractProvider");
  }
  return value;
};

export default Contract_;
