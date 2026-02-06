import {PaginatedResponse, PaginationQuery} from './pagination';

// House NFT representation (decoded from tokenDetail)
export interface HouseRepr {
    id: number;
    index: number;
    rarity: number;
    recovery: number;
    capacity: number;
    nftBlockNumber: number;
}

// House transaction request (for database insert)
export interface HouseTxReq {
    txHash: string;
    blockNumber: number;
    blockTimestamp: Date;
    buyerWalletAddress: string;
    sellerWalletAddress: string;
    status: string;
    houseDetails: string;
    amount: string;
    tokenId: string;
    payToken: string;
}

// House transaction representation (from database)
export interface HouseTxRepr {
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
    recovery: number;
    capacity: number;
    nftBlockNumber: number;
    updatedAt: Date;
}

// House transaction list response (paginated)
export type HouseTxListRepr = PaginatedResponse<HouseTxRepr>;

// House transaction filter context
export interface HouseTxFilterContext extends PaginationQuery {
    sellerWalletAddress: string[];
    buyerWalletAddress: string[];
    status: string[];
    txHash: string[];
    tokenId: string[];
    rarity: number[];
    payToken: string[];
    amount: string[]; // in rhs colon form: "gte:1000000000000000000"
}

// Default empty filter
export function createEmptyHouseTxFilterContext(): HouseTxFilterContext {
    return {
        page: 1,
        size: 20,
        orderBy: 'updated_at',
        orderDirection: 'desc',
        sellerWalletAddress: [],
        buyerWalletAddress: [],
        status: [],
        txHash: [],
        tokenId: [],
        rarity: [],
        payToken: [],
        amount: [],
    };
}
