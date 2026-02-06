import {DatabasePool, PoolClient, withTransaction} from '@/infrastructure/database/postgres';
import {
    createInsertBuilder,
    createQueryBuilder,
    getHasMore,
    getTotalPages,
    parseRhsValues,
} from '@/infrastructure/database/query-builder';
import {IHouseTransactionRepository} from '@/domain/interfaces/repository';
import {HouseTxFilterContext, HouseTxListRepr, HouseTxRepr, HouseTxReq,} from '@/domain/models/house';
import {TX_STATUS} from '@/domain/models/hero';
import {createEmptyStats, createEmptyStatsBase, Stats} from '@/domain/models/stats';
import {parseHouseDetails} from '@/utils/details-parser';
import {Logger} from '@/utils/logger';

// Database row type for house_orders table
interface HouseOrderRow {
    id: number;
    tx_hash: string;
    block_number: number;
    block_timestamp: Date;
    status: string;
    seller_wallet_address: string;
    buyer_wallet_address: string;
    amount_text: string;
    token_id: string;
    pay_token: string;
    rarity: number;
    recovery: number;
    capacity: number;
    nft_block_number: number;
    updated_at: Date;
}

// Convert database row to HouseTxRepr
function rowToHouseTxRepr(row: HouseOrderRow): HouseTxRepr {
    return {
        id: row.id,
        txHash: row.tx_hash,
        blockNumber: row.block_number,
        blockTimestamp: row.block_timestamp,
        status: row.status,
        sellerWalletAddress: row.seller_wallet_address,
        buyerWalletAddress: row.buyer_wallet_address,
        amount: row.amount_text,
        tokenId: row.token_id,
        payToken: row.pay_token,
        rarity: row.rarity,
        recovery: row.recovery,
        capacity: row.capacity,
        nftBlockNumber: row.nft_block_number,
        updatedAt: row.updated_at,
    };
}

// House transaction select columns
const HOUSE_SELECT_COLUMNS = [
    'id',
    'status',
    'tx_hash',
    'block_number',
    'block_timestamp',
    'seller_wallet_address',
    'buyer_wallet_address',
    'cast(amount as text) as amount_text',
    'token_id',
    'pay_token',
    'rarity',
    'recovery',
    'capacity',
    'nft_block_number',
    'updated_at',
].join(', ');

export class HouseTransactionRepository implements IHouseTransactionRepository {
    constructor(
        private db: DatabasePool,
        private logger: Logger
    ) {
    }

    async upsert(req: HouseTxReq): Promise<HouseTxRepr> {
        return withTransaction(this.db, async (client) => {
            // Validate at least one wallet address
            if (!req.buyerWalletAddress && !req.sellerWalletAddress) {
                throw new Error('At least one wallet address (buyer or seller) is required');
            }

            // Parse house metadata from details
            const houseMetadata = parseHouseDetails(req.houseDetails);

            // Build upsert query
            const insertBuilder = createInsertBuilder()
                .into('house_orders')
                .cols(
                    'tx_hash',
                    'block_number',
                    'block_timestamp',
                    'status',
                    'amount',
                    'buyer_wallet_address',
                    'seller_wallet_address',
                    'token_id',
                    'rarity',
                    'recovery',
                    'capacity',
                    'nft_block_number',
                    'pay_token'
                )
                .vals(
                    req.txHash,
                    req.blockNumber,
                    req.blockTimestamp,
                    req.status,
                    req.amount,
                    req.buyerWalletAddress || '',
                    req.sellerWalletAddress || '',
                    req.tokenId,
                    houseMetadata.rarity,
                    houseMetadata.recovery,
                    houseMetadata.capacity,
                    houseMetadata.nftBlockNumber,
                    req.payToken
                )
                .onConflict('tx_hash', 'DO UPDATE SET updated_at = NOW()')
                .returning('id');

            const {sql, params} = insertBuilder.build();
            const result = await client.query<{ id: number }>(sql, params);
            const houseOrderId = result.rows[0].id;

            // Handle status-specific logic
            if (req.status === TX_STATUS.SOLD) {
                // Delete previous listing orders when sold
                await this.softDeleteListingOrders(client, req.tokenId, req.blockNumber);
            } else if (req.status === TX_STATUS.LISTING) {
                // Prune old listing orders (keep only the latest)
                await this.pruneOldListingOrders(client, req.tokenId);
            }

            // Fetch and return the created record
            const fetchedRecord = await this.getByIdWithClient(client, houseOrderId);
            if (!fetchedRecord) {
                throw new Error(`Failed to fetch created house order with id ${houseOrderId}`);
            }
            return fetchedRecord;
        });
    }

    async filter(context: HouseTxFilterContext): Promise<HouseTxListRepr> {
        const qb = this.buildFilterQuery(context);
        const {sql, params} = qb.build();
        const countQuery = this.buildFilterCountQuery(context);

        // Execute both queries in parallel
        const [dataResult, countResult] = await Promise.all([
            this.db.query<HouseOrderRow>(sql, params),
            this.db.query<{ count: number }>(countQuery.sql, countQuery.params),
        ]);

        const transactions = dataResult.rows.map(rowToHouseTxRepr);
        const totalCount = countResult.rows[0]?.count ?? 0;

        return {
            transactions,
            totalCount,
            totalPages: getTotalPages(totalCount, context.size),
            page: context.page,
            size: context.size,
            hasMore: getHasMore(context.page, totalCount, context.size),
        };
    }

    async getById(id: number): Promise<HouseTxRepr | null> {
        const sql = `SELECT ${HOUSE_SELECT_COLUMNS} FROM house_orders WHERE id = $1 AND deleted = false`;
        const result = await this.db.query<HouseOrderRow>(sql, [id]);
        if (result.rows.length === 0) return null;
        return rowToHouseTxRepr(result.rows[0]);
    }

    async getByTokenId(tokenId: string): Promise<HouseTxRepr | null> {
        const sql = `
      SELECT ${HOUSE_SELECT_COLUMNS}
      FROM house_orders
      WHERE token_id = $1 AND deleted = false
      ORDER BY block_number DESC
      LIMIT 1
    `;
        const result = await this.db.query<HouseOrderRow>(sql, [tokenId]);
        if (result.rows.length === 0) return null;
        return rowToHouseTxRepr(result.rows[0]);
    }

    async deleteCreateOrder(tokenId: string, blockNumber: number): Promise<void> {
        const sql = `
      UPDATE house_orders
      SET deleted = true, updated_at = NOW()
      WHERE token_id = $1 AND status = 'listing' AND block_number <= $2
    `;
        await this.db.query(sql, [tokenId, blockNumber]);
    }

    async deleteAllCreateOrders(tokenId: string): Promise<void> {
        const sql = `
      UPDATE house_orders
      SET deleted = true, updated_at = NOW()
      WHERE token_id = $1 AND status = 'listing'
    `;
        await this.db.query(sql, [tokenId]);
    }

    async countOrders(orderType: string, windowHours: number): Promise<number> {
        const sql = `
      SELECT COUNT(*)::int as count
      FROM house_orders
      WHERE status = $1
        AND deleted = false
        AND updated_at >= NOW() - INTERVAL '1 hour' * $2
    `;
        const result = await this.db.query<{ count: number }>(sql, [orderType, windowHours]);
        return result.rows[0]?.count ?? 0;
    }

    async sumVolume(windowHours: number): Promise<string> {
        const sql = `
      SELECT COALESCE(SUM(amount), 0)::text as volume
      FROM house_orders
      WHERE status = 'sold'
        AND deleted = false
        AND updated_at >= NOW() - INTERVAL '1 hour' * $1
    `;
        const result = await this.db.query<{ volume: string }>(sql, [windowHours]);
        return result.rows[0]?.volume ?? '0';
    }

    async sumVolumeBcoin(windowHours: number): Promise<string> {
        const sql = `
      SELECT COALESCE(SUM(amount), 0)::text as volume
      FROM house_orders
      WHERE status = 'sold'
        AND deleted = false
        AND LOWER(pay_token) = 'bcoin'
        AND updated_at >= NOW() - INTERVAL '1 hour' * $1
    `;
        const result = await this.db.query<{ volume: string }>(sql, [windowHours]);
        return result.rows[0]?.volume ?? '0';
    }

    async sumVolumeSen(windowHours: number): Promise<string> {
        const sql = `
      SELECT COALESCE(SUM(amount), 0)::text as volume
      FROM house_orders
      WHERE status = 'sold'
        AND deleted = false
        AND LOWER(pay_token) = 'sen'
        AND updated_at >= NOW() - INTERVAL '1 hour' * $1
    `;
        const result = await this.db.query<{ volume: string }>(sql, [windowHours]);
        return result.rows[0]?.volume ?? '0';
    }

    async countByFilter(context: HouseTxFilterContext): Promise<number> {
        const countQuery = this.buildFilterCountQuery(context);
        const result = await this.db.query<{ count: number }>(countQuery.sql, countQuery.params);
        return result.rows[0]?.count ?? 0;
    }

    async getStats(): Promise<Stats> {
        const stats = createEmptyStats();

        // Get stats for each time period in parallel
        const [oneDay, sevenDays, thirtyDays] = await Promise.all([
            this.getStatsForPeriod(24),
            this.getStatsForPeriod(24 * 7),
            this.getStatsForPeriod(24 * 30),
        ]);

        stats.oneDay = oneDay;
        stats.sevenDays = sevenDays;
        stats.thirtyDays = thirtyDays;

        return stats;
    }

    private async softDeleteListingOrders(
        client: PoolClient,
        tokenId: string,
        blockNumber: number
    ): Promise<void> {
        const sql = `
      UPDATE house_orders
      SET deleted = true, updated_at = NOW()
      WHERE token_id = $1 AND status = 'listing' AND block_number <= $2
    `;
        await client.query(sql, [tokenId, blockNumber]);
    }

    private async pruneOldListingOrders(
        client: PoolClient,
        tokenId: string
    ): Promise<void> {
        const sql = `
      UPDATE house_orders
      SET deleted = true, updated_at = NOW()
      WHERE token_id = $1
        AND status = 'listing'
        AND block_number < (
          SELECT MAX(block_number) FROM house_orders
          WHERE token_id = $1 AND status = 'listing'
        )
    `;
        await client.query(sql, [tokenId]);
    }

    private async getByIdWithClient(client: PoolClient, id: number): Promise<HouseTxRepr | null> {
        const sql = `SELECT ${HOUSE_SELECT_COLUMNS} FROM house_orders WHERE id = $1 AND deleted = false`;
        const result = await client.query<HouseOrderRow>(sql, [id]);
        if (result.rows.length === 0) return null;
        return rowToHouseTxRepr(result.rows[0]);
    }

    private buildFilterQuery(context: HouseTxFilterContext) {
        const qb = createQueryBuilder()
            .select(HOUSE_SELECT_COLUMNS)
            .from('house_orders');

        this.applyFilterConditions(qb, context);
        qb.paginate(context);

        return qb;
    }

    private buildFilterCountQuery(context: HouseTxFilterContext) {
        const qb = createQueryBuilder().from('house_orders');
        this.applyFilterConditions(qb, context);
        return qb.buildCount();
    }

    private applyFilterConditions(
        qb: ReturnType<typeof createQueryBuilder>,
        context: HouseTxFilterContext
    ): void {
        // Always filter deleted = false
        qb.whereRaw('deleted = false');

        // IN clauses
        if (context.status.length > 0) {
            qb.whereIn('status', context.status);
        }
        if (context.sellerWalletAddress.length > 0) {
            qb.whereIn('LOWER(seller_wallet_address)', context.sellerWalletAddress.map(a => a.toLowerCase()));
        }
        if (context.buyerWalletAddress.length > 0) {
            qb.whereIn('LOWER(buyer_wallet_address)', context.buyerWalletAddress.map(a => a.toLowerCase()));
        }
        if (context.txHash.length > 0) {
            qb.whereIn('tx_hash', context.txHash);
        }
        if (context.rarity.length > 0) {
            qb.whereIn('rarity', context.rarity);
        }
        if (context.tokenId.length > 0) {
            qb.whereIn('token_id', context.tokenId);
        }
        if (context.payToken.length > 0) {
            qb.whereIn('LOWER(pay_token)', context.payToken.map(t => t.toLowerCase()));
        }

        // RHS range filters for amount
        if (context.amount.length > 0) {
            const amountOps = parseRhsValues(context.amount);
            const gte = amountOps.get('gte');
            const lte = amountOps.get('lte');
            if (gte !== undefined) qb.whereGte('amount', gte);
            if (lte !== undefined) qb.whereLte('amount', lte);
        }
    }

    private async getStatsForPeriod(windowHours: number) {
        const stats = createEmptyStatsBase();

        const [countListing, countSold, volume, volumeBcoin, volumeSen] = await Promise.all([
            this.countOrders(TX_STATUS.LISTING, windowHours),
            this.countOrders(TX_STATUS.SOLD, windowHours),
            this.sumVolume(windowHours),
            this.sumVolumeBcoin(windowHours),
            this.sumVolumeSen(windowHours),
        ]);

        stats.countListing = countListing;
        stats.countSold = countSold;
        stats.volume = volume;
        stats.volumeBcoin = volumeBcoin;
        stats.volumeSen = volumeSen;

        return stats;
    }
}

// Factory function
export function createHouseTransactionRepository(
    db: DatabasePool,
    logger: Logger
): IHouseTransactionRepository {
    return new HouseTransactionRepository(db, logger);
}
