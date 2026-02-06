import {DatabasePool} from '@/infrastructure/database/postgres';
import {IWalletHistoryRepository} from '@/domain/interfaces/repository';
import {WalletHistoryRepr, WalletTxFilterContext, WalletTxRepr,} from '@/domain/models/user';
import {getHasMore, getTotalPages} from '@/infrastructure/database/query-builder';
import {Logger} from '@/utils/logger';

// Database row type for wallet history (combined from hero_orders and house_orders)
interface WalletHistoryRow {
    asset_type: string;
    tx_type: string;
    rarity: number;
    amount_text: string;
    from_wallet_address: string;
    to_wallet_address: string;
    tx_hash: string;
    token_id: number;
    block_number: number;
    block_timestamp: Date;
    updated_at: Date;
}

// Convert database row to WalletTxRepr
function rowToWalletTxRepr(row: WalletHistoryRow): WalletTxRepr {
    return {
        assetType: row.asset_type,
        txType: row.tx_type,
        rarity: row.rarity,
        amount: row.amount_text,
        fromWalletAddress: row.from_wallet_address,
        toWalletAddress: row.to_wallet_address,
        txHash: row.tx_hash,
        tokenId: row.token_id,
        blockNumber: row.block_number,
        blockTimestamp: row.block_timestamp,
        updatedAt: row.updated_at,
    };
}

export class WalletHistoryRepository implements IWalletHistoryRepository {
    constructor(
        private db: DatabasePool,
        private logger: Logger
    ) {
    }

    async getHistory(context: WalletTxFilterContext): Promise<WalletHistoryRepr> {
        const walletLower = context.walletAddress.toLowerCase();
        const offset = (context.page - 1) * context.size;

        // Query to get combined history from both hero and house orders
        const dataQuery = `
      SELECT * FROM (
        -- Hero orders
        SELECT
          'hero' as asset_type,
          CASE
            WHEN LOWER(seller_wallet_address) = $1 THEN 'sell'
            ELSE 'buy'
          END as tx_type,
          rarity,
          cast(amount as text) as amount_text,
          seller_wallet_address as from_wallet_address,
          buyer_wallet_address as to_wallet_address,
          tx_hash,
          token_id,
          block_number,
          block_timestamp,
          updated_at
        FROM hero_orders
        WHERE (LOWER(seller_wallet_address) = $1 OR LOWER(buyer_wallet_address) = $1)
          AND status = 'sold'
          AND deleted = false

        UNION ALL

        -- House orders
        SELECT
          'house' as asset_type,
          CASE
            WHEN LOWER(seller_wallet_address) = $1 THEN 'sell'
            ELSE 'buy'
          END as tx_type,
          rarity,
          cast(amount as text) as amount_text,
          seller_wallet_address as from_wallet_address,
          buyer_wallet_address as to_wallet_address,
          tx_hash,
          token_id,
          block_number,
          block_timestamp,
          updated_at
        FROM house_orders
        WHERE (LOWER(seller_wallet_address) = $1 OR LOWER(buyer_wallet_address) = $1)
          AND status = 'sold'
          AND deleted = false
      ) combined
      ORDER BY ${this.getSortColumn(context.orderBy)} ${context.orderDirection.toUpperCase()}
      LIMIT $2 OFFSET $3
    `;

        // Count query
        const countQuery = `
      SELECT COUNT(*) as count FROM (
        SELECT 1 FROM hero_orders
        WHERE (LOWER(seller_wallet_address) = $1 OR LOWER(buyer_wallet_address) = $1)
          AND status = 'sold'
          AND deleted = false

        UNION ALL

        SELECT 1 FROM house_orders
        WHERE (LOWER(seller_wallet_address) = $1 OR LOWER(buyer_wallet_address) = $1)
          AND status = 'sold'
          AND deleted = false
      ) combined
    `;

        // Execute both queries in parallel
        const [dataResult, countResult] = await Promise.all([
            this.db.query<WalletHistoryRow>(dataQuery, [walletLower, context.size, offset]),
            this.db.query<{ count: string }>(countQuery, [walletLower]),
        ]);

        const transactions = dataResult.rows.map(rowToWalletTxRepr);
        const totalCount = parseInt(countResult.rows[0]?.count ?? '0', 10);

        return {
            transactions,
            totalCount,
            totalPages: getTotalPages(totalCount, context.size),
            page: context.page,
            size: context.size,
            hasMore: getHasMore(context.page, totalCount, context.size),
        };
    }

    private getSortColumn(orderBy: string): string {
        // Whitelist valid columns to prevent SQL injection
        const validColumns: Record<string, string> = {
            updated_at: 'updated_at',
            block_number: 'block_number',
            block_timestamp: 'block_timestamp',
            amount: 'amount_text',
        };
        return validColumns[orderBy] || 'updated_at';
    }
}

// Factory function
export function createWalletHistoryRepository(
    db: DatabasePool,
    logger: Logger
): IWalletHistoryRepository {
    return new WalletHistoryRepository(db, logger);
}
