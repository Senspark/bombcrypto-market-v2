// import WalletConnectProvider from "@walletconnect/web3-provider";
// import CoinbaseWalletSDK from "@coinbase/wallet-sdk"
// import { WalletLink } from "walletlink";
import { providers, IProviderOptions } from "web3modal";

// import coinbaseLogo from "./assets/images/coinbase_wallet_logo.png";

// FIXME: nhanc18 disable walletconnect vì lỗi
// const optionWallet = new WalletConnectProvider({
//   rpc: {
//     56: "https://bsc-dataseed3.binance.org",
//     97: "https://bsc-testnet-rpc.publicnode.com",
//   },
// });

const options: IProviderOptions = {};

if (!window.ethereum) {
  options["custom-metamask"] = {
    display: {
      logo: providers.METAMASK.logo,
      name: "Install MetaMask",
      description: "Connect using browser wallet",
    },
    package: {},
    connector: async () => {
      window.open("https://metamask.io");
      throw new Error("MetaMask not installed");
    },
  };
}

export const providerOptions: IProviderOptions = options;

// FIXME: nhanc18 disable walletconnect vì lỗi
// coinbasewallet: {
//   display: {
//     logo: coinbaseLogo,
//     name: "Coinbase Wallet",
//     description: "Connect to Coinbase Wallet",
//   },
//   package: WalletLink,
//   options: optionWallet,
// },
// walletconnect: {
//   package: WalletConnectProvider,
//   options: optionWallet,
// },
