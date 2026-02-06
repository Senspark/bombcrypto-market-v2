import {Contract, JsonRpcProvider} from 'ethers';
import ERC721_ABI from './abis/erc721.json';
import MARKET_ABI from './abis/market.json';

export interface OrderV2 {
    tokenDetail: bigint;
    seller: string;
    price: bigint;
    startedAt: bigint;
    tokenAddress: string;
}

export interface ERC721Contract {
    ownerOf(tokenId: bigint): Promise<string>;
    isApprovedForAll(owner: string, operator: string): Promise<boolean>;
}

export interface MarketContract {
    getOrderV2(tokenId: bigint): Promise<[bigint, string, bigint, bigint, string]>;
}

export function createERC721Contract(address: string, provider: JsonRpcProvider): Contract {
    return new Contract(address, ERC721_ABI, provider);
}

export function createMarketContract(address: string, provider: JsonRpcProvider): Contract {
    return new Contract(address, MARKET_ABI, provider);
}

export {ERC721_ABI, MARKET_ABI};
