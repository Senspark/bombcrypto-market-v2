import {HeroRepr} from './hero';
import {HouseRepr} from './house';
import {PaginatedResponse, PaginationQuery} from './pagination';

// User details request
export interface UserDetailsReq {
    walletAddress?: string;
    wallet_address?: string; // Deprecated: use walletAddress
    heroes: string[];
    houses: string[];
}

// User representation
export interface UserRepr {
    walletAddress: string;
    heroes: HeroRepr[];
    houses: HouseRepr[];
}

// Wallet transaction representation
export interface WalletTxRepr {
    assetType: string;
    txType: string;
    rarity: number;
    amount: string;
    fromWalletAddress: string;
    toWalletAddress: string;
    txHash: string;
    tokenId: number;
    blockNumber: number;
    blockTimestamp: Date;
    updatedAt: Date;
}

// Wallet history response (paginated)
export type WalletHistoryRepr = PaginatedResponse<WalletTxRepr>;

// Wallet transaction filter context
export interface WalletTxFilterContext extends PaginationQuery {
    walletAddress: string;
}

// Default empty filter
export function createEmptyWalletTxFilterContext(): WalletTxFilterContext {
    return {
        page: 1,
        size: 20,
        orderBy: 'updated_at',
        orderDirection: 'desc',
        walletAddress: '',
    };
}
