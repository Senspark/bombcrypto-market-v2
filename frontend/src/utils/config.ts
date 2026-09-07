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
import { rpcService } from "../components/Service/rpcService";
import type { NetworkType } from "../types/account";

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

export const rest_api: Record<string, string> = {
  BNB: '/api/bsc/',
  Polygon: '/api/polygon/',
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
  // Rarity 6-9 minPrice are template values (linear +20 step from rarity 5).
  // Designer review pending — see PHASE_3_REPORT.md §"Template values for designer review".
  6: { isSellable: true, minPrice: 90 },
  7: { isSellable: true, minPrice: 110 },
  8: { isSellable: true, minPrice: 130 },
  9: { isSellable: true, minPrice: 150 },
};

export const Bhouse: Record<number, BheroConfig> = {
  0: { isSellable: true, minPrice: 18 },
  1: { isSellable: true, minPrice: 60 },
  2: { isSellable: true, minPrice: 135 },
  3: { isSellable: true, minPrice: 240 },
  4: { isSellable: true, minPrice: 375 },
  5: { isSellable: true, minPrice: 540 },
};

export const fee = 10;

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

export const getRpcByChainId = (chainId: number): string => {
  // rpcService only serves MAINNET pools (it returns a mainnet RPC even for
  // testnet chainIds). On testnet that would point contract reads at mainnet
  // and return "0x", so always use the configured testnet RPC there.
  if (!isProduction) {
    if (chainId === ChainId.BNB) return RPC_BSC.BNB;
    if (chainId === ChainId.Polygon) return RPC_BSC.Polygon;
  }

  const runtimeRpc = rpcService.getRpc(chainId);
  if (runtimeRpc) {
    return runtimeRpc;
  }

  if (chainId === ChainId.BNB) {
    return RPC_BSC.BNB;
  }
  if (chainId === ChainId.Polygon) {
    return RPC_BSC.Polygon;
  }
  return "";
};

export const getRpcByNetwork = (network: string): string => {
  if (network === "Polygon") {
    return getRpcByChainId(ChainId.Polygon);
  }
  return getRpcByChainId(ChainId.BNB);
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

// --- Network <-> URL helpers -------------------------------------------------
// Keeps the selected chain in the URL (?network=bsc|polygon) so shared market
// links (e.g. a hero page) preserve which network the item is on instead of
// always defaulting to BSC. A missing/invalid param falls back to BSC.
export const NETWORK_URL_PARAM = "network";

export const networkToUrlParam = (network: string): string =>
  network === NETWORK.POLYGON ? "polygon" : "bsc";

export const urlParamToNetwork = (
  value: string | null | undefined
): NetworkType | null => {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "polygon" || v === "matic" || v === "pol") return NETWORK.POLYGON;
  if (v === "bsc" || v === "bnb" || v === "binance") return NETWORK.BNB;
  return null;
};

// Sets the current network on a path, preserving other query params and
// de-duplicating: URLSearchParams.set() removes any existing network entries
// first, so calling this repeatedly never stacks ?network=bsc&network=bsc...
export const withNetworkParam = (path: string, network: string): string => {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(NETWORK_URL_PARAM, networkToUrlParam(network));
  return `${base}?${params.toString()}`;
};

export const HeroType = {
  l: "L",
  lStake: "L+",
  s: "S",
} as const;
