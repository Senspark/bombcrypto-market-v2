import bhero from "./constant/BHero.json";
import bhouse from "./constant/BHouse.json";
import bcoin from "./constant/IBEP20.json";
import bheromarket from "./constant/BHeroMarket.json";
import abiSen from "./constant/AbiSen.json";
import address_bnb_test from "./constant/Address.Bsc.Test.json";
import address_bnb_prod from "./constant/Address.Bsc.Prod.json";
import address_polygon_test from "./constant/Address.Polygon.Test.json";
import address_polygon_prod from "./constant/Address.Polygon.Prod.json";
import BNBIcon from "../assets/images/Binance_icon.png";
import PolygonIcon from "../assets/images/polygon_icon.png";

export const isProduction = import.meta.env.VITE_IS_PROD === "true";

interface SmartContractConfig {
  address: string;
  abi: any[];
}

interface SmartContractsType {
  bcoin: SmartContractConfig;
  bcoinMatic: SmartContractConfig;
  bhero: SmartContractConfig;
  bheroMatic: SmartContractConfig;
  bhouse: SmartContractConfig;
  bhouseMatic: SmartContractConfig;
  bheromarket: SmartContractConfig;
  bheromarketMatic: SmartContractConfig;
  bhousemarket: SmartContractConfig;
  bhousemarketMatic: SmartContractConfig;
  sen: SmartContractConfig;
  senMatic: SmartContractConfig;
}

export const SmartContracts: SmartContractsType = {
  bcoin: {
    address: isProduction ? address_bnb_prod.bcoin : address_bnb_test.bcoin,
    abi: bcoin.abi,
  },
  bcoinMatic: {
    address: isProduction
      ? address_polygon_prod.bcoin
      : address_polygon_test.bcoin,
    abi: bcoin.abi,
  },
  bhero: {
    address: isProduction ? address_bnb_prod.bhero : address_bnb_test.bhero,
    abi: bhero.abi,
  },
  bheroMatic: {
    address: isProduction
      ? address_polygon_prod.bhero
      : address_polygon_test.bhero,
    abi: bhero.abi,
  },
  bhouse: {
    address: isProduction ? address_bnb_prod.bhouse : address_bnb_test.bhouse,
    abi: bhouse as any,
  },
  bhouseMatic: {
    address: isProduction
      ? address_polygon_prod.bhouse
      : address_polygon_test.bhouse,
    abi: bhouse as any,
  },
  bheromarket: {
    address: isProduction
      ? address_bnb_prod.bheromarket
      : address_bnb_test.bheromarket,
    abi: bheromarket.abi,
  },
  bheromarketMatic: {
    address: isProduction
      ? address_polygon_prod.bheromarket
      : address_polygon_test.bheromarket,
    abi: bheromarket.abi,
  },
  bhousemarket: {
    address: isProduction
      ? address_bnb_prod.bhousemarket
      : address_bnb_test.bhousemarket,
    abi: bheromarket.abi,
  },
  bhousemarketMatic: {
    address: isProduction
      ? address_polygon_prod.bhousemarket
      : address_polygon_test.bhousemarket,
    abi: bheromarket.abi,
  },
  sen: {
    address: isProduction ? address_bnb_prod.sen : address_bnb_test.sen,
    abi: abiSen.abi,
  },
  senMatic: {
    address: isProduction ? address_polygon_prod.sen : address_polygon_test.sen,
    abi: abiSen.abi,
  },
};

// Use local proxy to bypass CORS when testing production API on localhost
const useLocalProxy = import.meta.env.DEV && isProduction;
// Use local API server (set VITE_USE_LOCAL=true to enable)
const useLocalApi = import.meta.env.VITE_USE_LOCAL === 'true';
// Use new backend with same-origin API routes (set VITE_USE_NEW_BACKEND=true to enable)
const useNewBackend = import.meta.env.VITE_USE_NEW_BACKEND === 'true';

export const rest_api: Record<string, string> = {
  BNB: useNewBackend ? '/api/bsc/' : (useLocalApi ? '/local-api/api/v1/' : (useLocalProxy ? '/proxy-bnb/api/v1/' : (isProduction ? address_bnb_prod.api : address_bnb_test.api))),
  Polygon: useNewBackend ? '/api/polygon/' : (useLocalApi ? '/local-api/api/v1/' : (useLocalProxy ? '/proxy-polygon/api/v1/' : (isProduction ? address_polygon_prod.api : address_polygon_test.api))),
};

export const RPC_BSC: Record<string, string> = {
  BNB: isProduction ? address_bnb_prod.rpc : address_bnb_test.rpc,
  Polygon: isProduction ? address_polygon_prod.rpc : address_polygon_test.rpc,
};

export const cooldownByBlockNumber = 201600;

interface BheroConfig {
  isSellable: boolean;
  minPrice: number;
}

export const Bhero: Record<number, BheroConfig> = {
  0: { isSellable: true, minPrice: 1 },
  1: { isSellable: true, minPrice: 10 },
  2: { isSellable: true, minPrice: 20 },
  3: { isSellable: true, minPrice: 30 },
  4: { isSellable: true, minPrice: 50 },
  5: { isSellable: true, minPrice: 70 },
};

export const Bhouse: Record<number, BheroConfig> = {
  0: { isSellable: true, minPrice: 18 },
  1: { isSellable: true, minPrice: 60 },
  2: { isSellable: true, minPrice: 135 },
  3: { isSellable: true, minPrice: 240 },
  4: { isSellable: true, minPrice: 375 },
  5: { isSellable: true, minPrice: 540 },
};

export const fee = 15;

export const IMAGE_TOKEN_SHOW: Record<string, string> = {
  [SmartContracts.sen.address]: "/icons/sen_token.png",
  [SmartContracts.senMatic.address]: "/icons/sen_token.png",
  "0x0000000000000000000000000000000000000000": "/icons/token.png",
  [SmartContracts.bcoin.address]: "/icons/token.png",
  [SmartContracts.bcoinMatic.address]: "/icons/token.png",
};

export const ChainId: Record<string, number> = {
  BNB: isProduction ? 56 : 97,
  Polygon: isProduction ? 137 : 80002,
};

interface NetworkConfigItem {
  id: number;
  name: string;
  urlIcon: string;
  chainId: number;
}

export const NETWORK_CONFIG: NetworkConfigItem[] = [
  {
    id: 1,
    name: "BNB",
    urlIcon: BNBIcon,
    chainId: ChainId.BNB,
  },
  {
    id: 2,
    name: "Polygon",
    urlIcon: PolygonIcon,
    chainId: ChainId.Polygon,
  },
];

export const NETWORK = {
  BNB: "BNB",
  POLYGON: "Polygon",
} as const;

export const api = {
  shield: {
    domain: isProduction ? "https://api.bombcrypto.io/shield/heroes" : "https://api-test.bombcrypto.io/shield/heroes"
  }
};

export const HeroType = {
  l: "L",
  lStake: "L+",
  s: "S",
} as const;
