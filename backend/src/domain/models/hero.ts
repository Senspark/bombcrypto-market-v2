import {PaginatedResponse, PaginationQuery} from './pagination';

// Shield & Stake data (from Redis cache)
export interface ShieldData {
    shieldAmount: string;
    shieldLevel: number;
    heroType: string;
    rarity: string;
    currentStake: number;
    mustStake: number;
    currentStakeBcoin: number;
    currentStakeSen: number;
}

// Parse compact CSV shield data: "1488/1750,1,S,Legend,0,0,0,0"
export function parseCompactShieldData(compact: string): ShieldData | null {
    const parts = compact.split(',');
    if (parts.length !== 8) return null;

    return {
        shieldAmount: parts[0],
        shieldLevel: Number(parts[1]),
        heroType: parts[2],
        rarity: parts[3],
        currentStake: Number(parts[4]),
        mustStake: Number(parts[5]),
        currentStakeBcoin: Number(parts[6]),
        currentStakeSen: Number(parts[7]),
    };
}

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
    shieldData?: ShieldData | null;
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
    tokenId: number;
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
    tokenId: number;
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
    shieldData?: ShieldData | null;
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
    tokenId: number[];
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
