/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IS_PROD: string
  readonly VITE_USE_LOCAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// react-loadingg module declaration
declare module 'react-loadingg' {
  import { ComponentType } from 'react';
  interface LoadingProps {
    size?: 'small' | 'default' | 'large';
    color?: string;
    speed?: number;
    style?: React.CSSProperties;
  }
  export const BoxLoading: ComponentType<LoadingProps>;
  export const BlockLoading: ComponentType<LoadingProps>;
  export const BallPulseLoading: ComponentType<LoadingProps>;
  export const WaveLoading: ComponentType<LoadingProps>;
  export const CircleLoading: ComponentType<LoadingProps>;
}

// Ethereum provider declaration
interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
    isMetaMask?: boolean;
    networkVersion?: string;
  };
}
