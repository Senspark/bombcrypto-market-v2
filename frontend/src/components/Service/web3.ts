import { ChainId, isProduction, NETWORK } from "../../utils/config";
import { Contract, JsonRpcProvider, BrowserProvider, toBeHex } from "ethers";
import chainList from "../../utils/constant/chainlist.json";
import BcoinABI from "../../utils/constant/BcoinABI.json";

export const TokenName = {
  Bcoin: "Bcoin",
  Sen: "Sen",
  Bomb: "Bomb",
  SenPolygon: "SenPolygon",
  usdtBNB: "usdtBNB",
  usdtPolygon: "usdtPolygon",
} as const;

export type TokenNameType = (typeof TokenName)[keyof typeof TokenName];

interface TokenConfig {
  desc: string;
  address: string;
  rpcUrl: string;
}

const TOKEN_CONFIGS = new Map<string, TokenConfig[]>([
  [
    TokenName.Bcoin,
    [
      {
        desc: "mainnet",
        address: "0x00e1656e45f18ec6747F5a8496Fd39B50b38396D",
        rpcUrl: "https://bsc-dataseed.binance.org",
      },
      {
        desc: "testnet",
        address: "0x648a9CF8E95c73110D28E7e2329b2D0910Bd36B8",
        rpcUrl: "https://data-seed-prebsc-1-s3.binance.org:8545",
      },
    ],
  ],

  [
    TokenName.Sen,
    [
      {
        desc: "mainnet",
        address: "0xb43Ac9a81eDA5a5b36839d5b6FC65606815361b0",
        rpcUrl: "https://bsc-dataseed.binance.org",
      },
      {
        desc: "testnet",
        address: "0x4B5828F31550aFe15C61D7a765D9597ad4282325",
        rpcUrl: "https://data-seed-prebsc-1-s3.binance.org:8545",
      },
    ],
  ],

  [
    TokenName.SenPolygon,
    [
      {
        desc: "mainnet",
        address: "0xFe302B8666539d5046cd9aA0707bB327F5f94C22",
        rpcUrl: "https://rpc.ankr.com/polygon",
      },
      {
        desc: "testnet",
        address: "0x93567522610828695F36178b180989996082404A",
        rpcUrl: "https://rpc-amoy.polygon.technology/",
      },
    ],
  ],

  [
    TokenName.Bomb,
    [
      {
        desc: "mainnet",
        address: "0xB2C63830D4478cB331142FAc075A39671a5541dC",
        rpcUrl: "https://rpc.ankr.com/polygon",
      },
      {
        desc: "testnet",
        address: "0xcF693b54F86c49bbBa54Ff887488Bbf84C5D05BF",
        rpcUrl: "https://rpc-amoy.polygon.technology/",
      },
    ],
  ],

  [
    TokenName.usdtBNB,
    [
      {
        desc: "mainnet",
        address: "0x55d398326f99059fF775485246999027B3197955",
        rpcUrl: "https://bsc-dataseed.binance.org",
      },
      {
        desc: "testnet",
        address: "0xf879D9860109C34774607a2eD08e5dEf3A11373e",
        rpcUrl: "https://data-seed-prebsc-1-s3.binance.org:8545",
      },
    ],
  ],

  [
    TokenName.usdtPolygon,
    [
      {
        desc: "mainnet",
        address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        rpcUrl: "https://rpc.ankr.com/polygon",
      },
      {
        desc: "testnet",
        address: "0x65F3c080Fe88dC4788d0fF04CFE00D8C499964b3",
        rpcUrl: "https://rpc-amoy.polygon.technology/",
      },
    ],
  ],
]);

interface ChainInfo {
  chainId: number;
  name?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc?: string[];
  blockExplorerUrls?: string[];
}

export const getNetwork = (chainId: number): ChainInfo | undefined => {
  const chains = chainList.data as ChainInfo[];

  return chains.find((item) => item.chainId === chainId);
};

export const changeNetwork = async (chainId: number): Promise<boolean> => {
  const { ethereum } = window;
  if (!ethereum) return false;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toBeHex(chainId) }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        const network = getNetwork(chainId);
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: toBeHex(chainId),
              chainName: network?.name,
              nativeCurrency: network?.nativeCurrency,
              rpcUrls: network?.rpc,
              blockExplorerUrls: network?.blockExplorerUrls,
            },
          ],
        });
      } catch (addError) {
        console.error(addError);
      }
    }
    return false;
  }
};

export const onListenNetworkChange = (onChange: (chainId: string) => void): void => {
  if (!window.ethereum) return;
  window.ethereum.on("networkChanged", (chainId: string) => {
    onChange(chainId);
  });
};

export const offListenNetworkChange = (onChange: (chainId: string) => void): void => {
  if (!window.ethereum) return;
  window.ethereum.removeListener("networkChanged", onChange);
};

export const onListenAcountChange = (onChange: () => void): void => {
  if (!window.ethereum) return;
  window.ethereum.on("accountsChanged", () => {
    onChange();
  });
};

export const convetChainIdToNetWork = (chainId: number): string => {
  if (chainId == ChainId.BNB) {
    return NETWORK.BNB;
  }
  if (chainId == ChainId.Polygon) {
    return NETWORK.POLYGON;
  }
  return "";
};

export const getBalance = async (tokenName: TokenNameType): Promise<string | number> => {
  const tokenConfigs = TOKEN_CONFIGS.get(tokenName);
  if (!tokenConfigs) {
    throw new Error("Invalid token");
  }
  const config = isProduction ? tokenConfigs[0] : tokenConfigs[1];
  const provider = new JsonRpcProvider(config.rpcUrl);
  const walletAddress = await getAccount();
  if (walletAddress) {
    const contract = new Contract(config.address, BcoinABI, provider);
    const result = await contract.balanceOf(walletAddress);
    return result.toString();
  }
  return 0;
};

export const getAccount = async (): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("No ethereum provider found");
  }
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_accounts", []);
  if (!accounts || accounts.length === 0) {
    throw new Error("No account found");
  }
  return accounts[0];
};
