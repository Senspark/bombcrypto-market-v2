/**
 * BHouseMarket Contract Wrapper
 * Typed wrapper for the BHouse NFT Marketplace contract
 */

import {Contract, Interface, JsonRpcProvider} from 'ethers';
import BHouseMarketABI from './abis/bhouse-market.json';
import type {MarketOrder, MarketOrderV2} from './bhero-market';
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

export type {MarketOrder, MarketOrderV2};

/**
 * BHouseMarket contract wrapper
 */
export class BHouseMarketContract {
    private readonly contract: Contract;
    private readonly iface: Interface;

    constructor(address: string, provider: JsonRpcProvider) {
        this.iface = new Interface(BHouseMarketABI);
        this.contract = new Contract(address, BHouseMarketABI, provider);
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
 * Factory function to create BHouseMarketContract
 */
export function createBHouseMarketContract(
    address: string,
    provider: JsonRpcProvider,
): BHouseMarketContract {
    return new BHouseMarketContract(address, provider);
}

/**
 * BHouseMarket Service using BlockChainCenterApi
 * API-based alternative to BHouseMarketContract for subscriber use
 */
export class BHouseMarketService {
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
}

/**
 * Factory function to create BHouseMarketService
 */
export function createBHouseMarketService(
    contractAddress: string,
    client: BlockChainCenterApi,
): BHouseMarketService {
    return new BHouseMarketService(contractAddress, client);
}
