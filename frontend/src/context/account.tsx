import React, { createContext, useContext, useRef, useState, ReactNode, MutableRefObject } from "react";
import { newWeb3Modal } from "./smc";
import { NETWORK_CONFIG } from "../utils/config";
import { NetworkType, AuthState, AccountContextValue } from "../types/account";

export const AccountContext = createContext<AccountContextValue | undefined>(undefined);

interface AccountProviderProps {
  children: ReactNode;
  type?: string;
}

function Account({ children, type }: AccountProviderProps): JSX.Element {
  const [network, setnetwork] = useState<NetworkType>(NETWORK_CONFIG[0].name as NetworkType);
  const [auth, setAuth] = useState<AuthState>({
    wallet: {},
    address: "",
    logged: false,
  });

  const clear = useRef<(() => void) | undefined>();

  const logout = (): void => {
    newWeb3Modal.clearCachedProvider();
    setAuth({ wallet: {}, address: "", logged: false });
    window.localStorage.removeItem("logged");
  };

  const updateClear = (func: () => void): void => {
    clear.current = func;
  };

  const updateWallet = async (
    bcoin: string,
    sen: string,
    bcoinMatic: string,
    senMatic: string,
    bhouse?: number,
    bhero?: number
  ): Promise<void> => {
    console.log(bcoinMatic);
    setAuth({
      ...auth,
      wallet: {
        bcoin: bcoin,
        sen: sen,
        bcoinMatic: bcoinMatic,
        senMatic: senMatic,
        bhouse: bhouse,
        bhero: bhero,
      },
    });
  };

  const updateNetwork = async (value: NetworkType): Promise<void> => {
    setnetwork(value);
  };

  return (
    <AccountContext.Provider
      value={{
        auth,
        network,
        setAuth,
        logout,
        clear,
        updateClear,
        updateWallet,
        updateNetwork,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export const useAccount = (): AccountContextValue => {
  const account = useContext(AccountContext);
  if (!account) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return account;
};

export default Account;
