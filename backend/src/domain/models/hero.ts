import {PaginatedResponse, PaginationQuery} from './pagination';

// Hero NFT representation (decoded from tokenDetail)
export interface HeroRepr {
    id: number;
    index: number;
    rarity: number;
    level: number;
    color: number;
    skin: number;
    stamina: number;
    speed: number;
    bombSkin: number;
    bombCount: number;
    bombPower: number;
    bombRange: number;
    abilities: number[];
    abilitiesHeroS: number[];
    nftBlockNumber: number;
}

// Hero transaction request (for database insert)
export interface HeroTxReq {
    txHash: string;
    blockNumber: number;
    blockTimestamp: Date;
    buyerWalletAddress: string;
    sellerWalletAddress: string;
    status: string;
    heroDetails: string;
    amount: string;
    tokenId: string;
    payToken: string;
}

// Hero transaction representation (from database)
export interface HeroTxRepr {
    id: number;
    txHash: string;
    blockNumber: number;
    blockTimestamp: Date;
    status: string;
    sellerWalletAddress: string;
    buyerWalletAddress: string;
    amount: string;
    tokenId: string;
    payToken: string;
    rarity: number;
    level: number;
    color: number;
    skin: number;
    stamina: number;
    speed: number;
    bombSkin: number;
    bombCount: number;
    bombPower: number;
    bombRange: number;
    abilities: number[];
    abilitiesHeroS: number[];
    nftBlockNumber: number;
    updatedAt: Date;
}

// Hero transaction list response (paginated)
export type HeroTxListRepr = PaginatedResponse<HeroTxRepr>;

// Hero transaction filter context
export interface HeroTxFilterContext extends PaginationQuery {
    sellerWalletAddress: string[];
    buyerWalletAddress: string[];
    status: string[];
    txHash: string[];
    rarity: number[];
    tokenId: string[];
    level: string[]; // in rhs colon form: "gte:20"
    stamina: number;
    speed: number;
    bombPower: number;
    bombCount: number;
    bombRange: number;
    abilities: number[];
    abilitiesHeroS: number[];
    payToken: string[];
    amount: string[]; // in rhs colon form: "gte:1000000000000000000"
}

// Default empty filter
export function createEmptyHeroTxFilterContext(): HeroTxFilterContext {
    return {
        page: 1,
        size: 20,
        orderBy: 'updated_at',
        orderDirection: 'desc',
        sellerWalletAddress: [],
        buyerWalletAddress: [],
        status: [],
        txHash: [],
        rarity: [],
        tokenId: [],
        level: [],
        stamina: 0,
        speed: 0,
        bombPower: 0,
        bombCount: 0,
        bombRange: 0,
        abilities: [],
        abilitiesHeroS: [],
        payToken: [],
        amount: [],
    };
}

// Transaction status constants
export const TX_STATUS = {
    LISTING: 'listing',
    SOLD: 'sold',
} as const;

export type TxStatus = typeof TX_STATUS[keyof typeof TX_STATUS];
