/**
 * ERC721 Contract Wrapper
 * Typed wrapper for ERC721 NFT contracts with tokenDetails support
 */

import {Contract, Interface, JsonRpcProvider} from 'ethers';
import ERC721ABI from './abis/erc721.json';

/**
 * ERC721 contract wrapper
 */
export class ERC721Contract {
    private readonly contract: Contract;
    private readonly iface: Interface;

    constructor(address: string, provider: JsonRpcProvider) {
        this.iface = new Interface(ERC721ABI);
        this.contract = new Contract(address, ERC721ABI, provider);
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
     * Get token balance of an owner
     */
    async balanceOf(owner: string): Promise<bigint> {
        return this.contract.balanceOf(owner);
    }

    /**
     * Get owner of a token
     */
    async ownerOf(tokenId: bigint): Promise<string> {
        return this.contract.ownerOf(tokenId);
    }

    /**
     * Get approved address for a token
     */
    async getApproved(tokenId: bigint): Promise<string> {
        return this.contract.getApproved(tokenId);
    }

    /**
     * Check if operator is approved for all tokens of owner
     */
    async isApprovedForAll(owner: string, operator: string): Promise<boolean> {
        return this.contract.isApprovedForAll(owner, operator);
    }

    /**
     * Get token details (custom function on BombCrypto NFTs)
     */
    async tokenDetails(tokenId: bigint): Promise<bigint> {
        return this.contract.tokenDetails(tokenId);
    }
}

/**
 * Factory function to create ERC721Contract
 */
export function createERC721Contract(
    address: string,
    provider: JsonRpcProvider,
): ERC721Contract {
    return new ERC721Contract(address, provider);
}
