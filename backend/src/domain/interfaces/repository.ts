import {HeroTxFilterContext, HeroTxListRepr, HeroTxRepr, HeroTxReq,} from '../models/hero';
import {HouseTxFilterContext, HouseTxListRepr, HouseTxRepr, HouseTxReq,} from '../models/house';
import {WalletHistoryRepr, WalletTxFilterContext,} from '../models/user';
import {Stats} from '../models/stats';
import {ProcessingBlockNumberRepr} from '../models/admin';

// Hero transaction repository interface
export interface IHeroTransactionRepository {
    // Upsert hero transaction (create or update)
    upsert(req: HeroTxReq): Promise<HeroTxRepr>;

    // Filter hero transactions with dynamic query
    filter(context: HeroTxFilterContext): Promise<HeroTxListRepr>;

    // Get hero transaction by ID
    getById(id: number): Promise<HeroTxRepr | null>;

    // Get hero transaction by token ID
    getByTokenId(tokenId: string): Promise<HeroTxRepr | null>;

    // Delete create order (soft delete when sold/cancelled)
    deleteCreateOrder(tokenId: string, blockNumber: number): Promise<void>;

    // Delete all create orders for a token (when cancelled)
    deleteAllCreateOrders(tokenId: string): Promise<void>;

    // Count orders by type and time window (hours)
    countOrders(orderType: string, windowHours: number): Promise<number>;

    // Sum volume within time window (hours)
    sumVolume(windowHours: number): Promise<string>;

    // Sum volume by pay token
    sumVolumeBcoin(windowHours: number): Promise<string>;

    sumVolumeSen(windowHours: number): Promise<string>;

    // Count orders by filtering
    countByFilter(context: HeroTxFilterContext): Promise<number>;

    // Get stats (for API response)
    getStats(): Promise<Stats>;
}

// House transaction repository interface
export interface IHouseTransactionRepository {
    // Upsert house transaction (create or update)
    upsert(req: HouseTxReq): Promise<HouseTxRepr>;

    // Filter house transactions with dynamic query
    filter(context: HouseTxFilterContext): Promise<HouseTxListRepr>;

    // Get house transaction by ID
    getById(id: number): Promise<HouseTxRepr | null>;

    // Get house transaction by token ID
    getByTokenId(tokenId: string): Promise<HouseTxRepr | null>;

    // Delete create order (soft delete when sold/cancelled)
    deleteCreateOrder(tokenId: string, blockNumber: number): Promise<void>;

    // Delete all create orders for a token (when cancelled)
    deleteAllCreateOrders(tokenId: string): Promise<void>;

    // Count orders by type and time window (hours)
    countOrders(orderType: string, windowHours: number): Promise<number>;

    // Sum volume within time window (hours)
    sumVolume(windowHours: number): Promise<string>;

    // Sum volume by pay token
    sumVolumeBcoin(windowHours: number): Promise<string>;

    sumVolumeSen(windowHours: number): Promise<string>;

    // Count orders by filtering
    countByFilter(context: HouseTxFilterContext): Promise<number>;

    // Get stats (for API response)
    getStats(): Promise<Stats>;
}

// Wallet history repository interface
export interface IWalletHistoryRepository {
    // Get wallet transaction history
    getHistory(context: WalletTxFilterContext): Promise<WalletHistoryRepr>;
}

// Block tracking repository interface (for subscribers)
export interface IBlockTrackingRepository {
    // Get current processing block number
    getBlockNumber(): Promise<number>;

    // Set current processing block number (only if advancing)
    setBlockNumber(blockNumber: number): Promise<void>;

    // Record failed block and return failure count
    increaseFailure(blockNumber: number): Promise<number>;

    // Get failed blocks that need retry (failure < maxRetries)
    getFailedBlocks(maxRetries: number): Promise<Array<{ blockNumber: number; failure: number }>>;

    // Remove failed block after successful processing
    removeFailedBlock(blockNumber: number): Promise<void>;
}

// Admin repository interface
export interface IAdminRepository {
    // Get processing block numbers for both hero and house subscribers
    getProcessingBlockNumbers(): Promise<ProcessingBlockNumberRepr>;
}
