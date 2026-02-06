/**
 * Account/Wallet type definitions
 */
import { MutableRefObject } from 'react';

export interface WalletBalance {
  bcoin: string;
  sen: string;
  bcoinMatic: string;
  senMatic: string;
  bhouse?: number;
  bhero?: number;
}

export interface AuthState {
  wallet: Partial<WalletBalance>;
  address: string;
  logged: boolean;
}

export type NetworkType = 'BNB' | 'Polygon';

export interface AccountContextValue {
  auth: AuthState;
  network: NetworkType;
  setAuth: React.Dispatch<React.SetStateAction<AuthState>>;
  updateWallet: (
    bcoin: string,
    sen: string,
    bcoinMatic: string,
    senMatic: string,
    bhouse?: number,
    bhero?: number
  ) => Promise<void>;
  updateNetwork: (network: NetworkType) => Promise<void>;
  logout: () => void;
  clear: MutableRefObject<(() => void) | undefined>;
  updateClear: (func: () => void) => void;
}
