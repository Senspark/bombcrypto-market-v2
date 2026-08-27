/**
 * BHeroMarket Contract Wrapper
 * Typed wrapper for the BHero NFT Marketplace contract
 */

import {Contract, Interface, JsonRpcProvider} from 'ethers';
import BHeroMarketABI from './abis/bhero-market.json';
import type {BlockChainCenterApi} from '../blockchain-center-api';

const GET_TOKEN_PAY_LIST_ABI = [
    {
        inputs: [{internalType: 'uint256[]', name: '_tokenId', type: 'uint256[]'}],
        name: 'getTokenPayList',
        outputs: [{internalType: 'address[]', name: '', type: 'address[]'}],
        stateMutability: 'view',
        type: 'function',
    },
];

const GET_ORDER_V2_ABI = [
    {
        inputs: [{internalType: 'uint256', name: '_tokenId', type: 'uint256'}],
        name: 'getOrderV2',
        outputs: [
            {internalType: 'uint256', name: 'tokenDetail', type: 'uint256'},
            {internalType: 'address', name: 'seller', type: 'address'},
            {internalType: 'uint256', name: 'price', type: 'uint256'},
            {internalType: 'uint256', name: 'startedAt', type: 'uint256'},
            {internalType: 'address', name: 'tokenAddress', type: 'address'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
];

// On-chain order as returned by BlockChainCenterApi (numeric fields serialized to strings)
export interface RawMarketOrderV2 {
    tokenDetail: string;
    seller: string;
    price: string;
    startedAt: string;
    tokenAddress: string;
}

/**
 * Order data returned from getOrder/getOrderV2
 */
export interface MarketOrder {
    tokenDetail: bigint;
    seller: string;
    price: bigint;
    startedAt: bigint;
}

export interface MarketOrderV2 extends MarketOrder {
    tokenAddress: string;
}

/**
 * BHeroMarket contract wrapper
 */
export class BHeroMarketContract {
    private readonly contract: Contract;
    private readonly iface: Interface;

    constructor(address: string, provider: JsonRpcProvider) {
        this.iface = new Interface(BHeroMarketABI);
        this.contract = new Contract(address, BHeroMarketABI, provider);
    }

    /**
     * Get the contract interface for event parsing
     */
    getInterface(): Interface {
        return this.iface;
    }

    /**
     * Get the contract address
     */
    getAddress(): string {
        return this.contract.target as string;
    }

    /**
     * Get order details for a token
     */
    async getOrder(tokenId: bigint): Promise<MarketOrder> {
        const result = await this.contract.getOrder(tokenId);
        return {
            tokenDetail: result[0],
            seller: result[1],
            price: result[2],
            startedAt: result[3],
        };
    }

    /**
     * Get order details V2 (includes token address)
     */
    async getOrderV2(tokenId: bigint): Promise<MarketOrderV2> {
        const result = await this.contract.getOrderV2(tokenId);
        return {
            tokenDetail: result[0],
            seller: result[1],
            price: result[2],
            startedAt: result[3],
            tokenAddress: result[4],
        };
    }

    /**
     * Get contract balance
     */
    async getBalance(): Promise<bigint> {
        return this.contract.getBalance();
    }

    /**
     * Check if contract is paused
     */
    async isPaused(): Promise<boolean> {
        return this.contract.paused();
    }

    /**
     * Get tax rate
     */
    async getTaxRate(): Promise<bigint> {
        return this.contract.taxRate();
    }

    /**
     * Get cooldown before cancel
     */
    async getCooldownBeforeCancel(): Promise<bigint> {
        return this.contract.cooldownBeforeCancel();
    }

    /**
     * Get payment token addresses for tokens
     */
    async getTokenPayList(tokenIds: bigint[]): Promise<string[]> {
        return this.contract.getTokenPayList(tokenIds);
    }

    /**
     * Check if an address is blacklisted
     */
    async isBlacklist(address: string): Promise<boolean> {
        return this.contract.isBlacklist(address);
    }

    /**
     * Check if a token is sellable at a given price
     */
    async isSellable(tokenDetails: bigint, price: bigint): Promise<boolean> {
        return this.contract.isSellable(tokenDetails, price);
    }
}

/**
 * Factory function to create BHeroMarketContract
 */
export function createBHeroMarketContract(
    address: string,
    provider: JsonRpcProvider,
): BHeroMarketContract {
    return new BHeroMarketContract(address, provider);
}

/**
 * BHeroMarket Service using BlockChainCenterApi
 * API-based alternative to BHeroMarketContract for subscriber use
 */
export class BHeroMarketService {
    private readonly contractAddress: string;
    private readonly client: BlockChainCenterApi;

    constructor(contractAddress: string, client: BlockChainCenterApi) {
        this.contractAddress = contractAddress;
        this.client = client;
    }

    /**
     * Get the contract address
     */
    getAddress(): string {
        return this.contractAddress;
    }

    /**
     * Get payment token addresses for tokens
     */
    async getTokenPayList(tokenIds: bigint[]): Promise<string[]> {
        return this.client.callContract<string[]>(
            this.contractAddress,
            GET_TOKEN_PAY_LIST_ABI,
            'getTokenPayList',
            [tokenIds.map(id => id.toString())],
        );
    }

    /**
     * Get on-chain order details (reverts if no active order).
     * Tuple values arrive as a positional string array from the API.
     */
    async getOrderV2(tokenId: bigint): Promise<RawMarketOrderV2> {
        const r = await this.client.callContract<string[]>(
            this.contractAddress,
            GET_ORDER_V2_ABI,
            'getOrderV2',
            [tokenId.toString()],
        );
        return {
            tokenDetail: r[0],
            seller: r[1],
            price: r[2],
            startedAt: r[3],
            tokenAddress: r[4],
        };
    }
}

/**
 * Factory function to create BHeroMarketService
 */
export function createBHeroMarketService(
    contractAddress: string,
    client: BlockChainCenterApi,
): BHeroMarketService {
    return new BHeroMarketService(contractAddress, client);
}
