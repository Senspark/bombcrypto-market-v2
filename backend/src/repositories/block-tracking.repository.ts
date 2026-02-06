import {DatabasePool} from '@/infrastructure/database/postgres';
import {IAdminRepository, IBlockTrackingRepository} from '@/domain/interfaces/repository';
import {ProcessingBlockNumberRepr} from '@/domain/models/admin';
import {Logger} from '@/utils/logger';

// Subscriber type: 'hero' or 'house'
export type SubscriberType = 'hero' | 'house';

// Failed block row
interface FailedBlockRow {
    block_number: number;
    failure: number;
}

// Block tracking repository implementation
export class BlockTrackingRepository implements IBlockTrackingRepository {
    private readonly blockNumberTable: string;
    private readonly failedBlocksTable: string;

    constructor(
        private db: DatabasePool,
        private logger: Logger,
        subscriberType: SubscriberType
    ) {
        this.blockNumberTable = `${subscriberType}_subscriber_block_number`;
        this.failedBlocksTable = `${subscriberType}_subscriber_failed_blocks`;
    }

    async getBlockNumber(): Promise<number> {
        const sql = `SELECT block_number FROM ${this.blockNumberTable} WHERE id = TRUE`;
        const result = await this.db.query<{ block_number: string }>(sql);

        if (result.rows.length === 0) {
            throw new Error(`No block number found in ${this.blockNumberTable}`);
        }

        // PostgreSQL bigint comes as string, convert to number
        return parseInt(result.rows[0].block_number, 10);
    }

    async setBlockNumber(blockNumber: number): Promise<void> {
        // Only update if advancing (new block number > current)
        const sql = `
      UPDATE ${this.blockNumberTable}
      SET block_number = $1
      WHERE id = TRUE AND block_number < $1
    `;
        const result = await this.db.query(sql, [blockNumber]);

        if (result.rowCount === 0) {
            this.logger.warn('Attempted to set lower or equal block number, skipped', {
                attemptedBlock: blockNumber,
                table: this.blockNumberTable,
            });
        }
    }

    async increaseFailure(blockNumber: number): Promise<number> {
        const sql = `
      INSERT INTO ${this.failedBlocksTable} AS t (block_number, created_at, updated_at)
      VALUES ($1, NOW(), NOW())
      ON CONFLICT (block_number) DO UPDATE SET
        failure = t.failure + 1,
        updated_at = NOW()
      RETURNING failure
    `;
        const result = await this.db.query<{ failure: number }>(sql, [blockNumber]);
        return result.rows[0].failure;
    }

    async getFailedBlocks(maxRetries: number): Promise<Array<{ blockNumber: number; failure: number }>> {
        const sql = `
      SELECT block_number, failure
      FROM ${this.failedBlocksTable}
      WHERE failure < $1
      ORDER BY block_number ASC
    `;
        const result = await this.db.query<FailedBlockRow>(sql, [maxRetries]);

        return result.rows.map(row => ({
            blockNumber: parseInt(row.block_number.toString(), 10),
            failure: row.failure,
        }));
    }

    async removeFailedBlock(blockNumber: number): Promise<void> {
        const sql = `DELETE FROM ${this.failedBlocksTable} WHERE block_number = $1`;
        await this.db.query(sql, [blockNumber]);
    }
}

// Admin repository implementation
export class AdminRepository implements IAdminRepository {
    constructor(
        private db: DatabasePool,
        private logger: Logger
    ) {
    }

    async getProcessingBlockNumbers(): Promise<ProcessingBlockNumberRepr> {
        const sql = `
      SELECT
        hsbn.block_number as hero_block_number,
        hsbn2.block_number as house_block_number
      FROM hero_subscriber_block_number hsbn
      FULL OUTER JOIN house_subscriber_block_number hsbn2 ON true
    `;
        const result = await this.db.query<{
            hero_block_number: string | null;
            house_block_number: string | null;
        }>(sql);

        if (result.rows.length === 0) {
            return {
                heroBlockNumber: 0,
                houseBlockNumber: 0,
            };
        }

        const row = result.rows[0];
        return {
            heroBlockNumber: row.hero_block_number ? parseInt(row.hero_block_number, 10) : 0,
            houseBlockNumber: row.house_block_number ? parseInt(row.house_block_number, 10) : 0,
        };
    }
}

// Factory functions
export function createBlockTrackingRepository(
    db: DatabasePool,
    logger: Logger,
    subscriberType: SubscriberType
): IBlockTrackingRepository {
    return new BlockTrackingRepository(db, logger, subscriberType);
}

export function createHeroBlockTrackingRepository(
    db: DatabasePool,
    logger: Logger
): IBlockTrackingRepository {
    return createBlockTrackingRepository(db, logger, 'hero');
}

export function createHouseBlockTrackingRepository(
    db: DatabasePool,
    logger: Logger
): IBlockTrackingRepository {
    return createBlockTrackingRepository(db, logger, 'house');
}

export function createAdminRepository(
    db: DatabasePool,
    logger: Logger
): IAdminRepository {
    return new AdminRepository(db, logger);
}
