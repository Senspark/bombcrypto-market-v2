import {DatabasePool, PoolClient, withTransaction} from '@/infrastructure/database/postgres';
import {
    createInsertBuilder,
    createQueryBuilder,
    getHasMore,
    getTotalPages,
    parseRhsValues,
} from '@/infrastructure/database/query-builder';
import {IHeroTransactionRepository} from '@/domain/interfaces/repository';
import {HeroTxFilterContext, HeroTxListRepr, HeroTxRepr, HeroTxReq, TX_STATUS,} from '@/domain/models/hero';
import {createEmptyStats, createEmptyStatsBase, Stats} from '@/domain/models/stats';
import {abilitiesToString, parseAbilitiesString, parseHeroDetails} from '@/utils/details-parser';
import {Logger} from '@/utils/logger';

// Database row type for hero_orders table
interface HeroOrderRow {
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
    level: number;
    color: number;
    skin: number;
    stamina: number;
    speed: number;
    bomb_skin: number;
    bomb_count: number;
    bomb_power: number;
    bomb_range: number;
    abilities: string;
    abilities_hero_s: string;
    nft_block_number: number;
    updated_at: Date;
}

// Convert database row to HeroTxRepr
function rowToHeroTxRepr(row: HeroOrderRow): HeroTxRepr {
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
        level: row.level,
        color: row.color,
        skin: row.skin,
        stamina: row.stamina,
        speed: row.speed,
        bombSkin: row.bomb_skin,
        bombCount: row.bomb_count,
        bombPower: row.bomb_power,
        bombRange: row.bomb_range,
        abilities: parseAbilitiesString(row.abilities),
        abilitiesHeroS: parseAbilitiesString(row.abilities_hero_s),
        nftBlockNumber: row.nft_block_number,
        updatedAt: row.updated_at,
    };
}

// Hero transaction select columns
const HERO_SELECT_COLUMNS = [
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
    'level',
    'color',
    'skin',
    'stamina',
    'speed',
    'bomb_skin',
    'bomb_count',
    'bomb_power',
    'bomb_range',
    'abilities',
    'abilities_hero_s',
    'nft_block_number',
    'updated_at',
].join(', ');

export class HeroTransactionRepository implements IHeroTransactionRepository {
    constructor(
        private db: DatabasePool,
        private logger: Logger
    ) {
    }

    async upsert(req: HeroTxReq): Promise<HeroTxRepr> {
        return withTransaction(this.db, async (client) => {
            // Validate at least one wallet address
            if (!req.buyerWalletAddress && !req.sellerWalletAddress) {
                throw new Error('At least one wallet address (buyer or seller) is required');
            }

            // Parse hero metadata from details
            const heroMetadata = parseHeroDetails(req.heroDetails);
            const abilitiesStr = abilitiesToString(heroMetadata.abilities);
            const abilitiesHeroSStr = abilitiesToString(heroMetadata.abilitiesHeroS);

            // Build upsert query
            const insertBuilder = createInsertBuilder()
                .into('hero_orders')
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
                    'level',
                    'color',
                    'skin',
                    'stamina',
                    'speed',
                    'bomb_skin',
                    'bomb_count',
                    'bomb_power',
                    'bomb_range',
                    'abilities',
                    'abilities_hero_s',
                    'nft_block_number',
                    'pay_token'
                )
                .vals(
                    req.txHash,
                    req.blockNumber,
                    req.blockTimestamp,
                    req.status,
                    req.amount, // PostgreSQL will handle string to numeric conversion
                    req.buyerWalletAddress || '',
                    req.sellerWalletAddress || '',
                    req.tokenId,
                    heroMetadata.rarity,
                    heroMetadata.level,
                    heroMetadata.color,
                    heroMetadata.skin,
                    heroMetadata.stamina,
                    heroMetadata.speed,
                    heroMetadata.bombSkin,
                    heroMetadata.bombCount,
                    heroMetadata.bombPower,
                    heroMetadata.bombRange,
                    abilitiesStr,
                    abilitiesHeroSStr,
                    heroMetadata.nftBlockNumber,
                    req.payToken
                )
                .onConflict('tx_hash', 'DO UPDATE SET updated_at = NOW()')
                .returning('id');

            const {sql, params} = insertBuilder.build();
            const result = await client.query<{ id: number }>(sql, params);
            const heroOrderId = result.rows[0].id;

            // Insert hero abilities
            if (heroMetadata.abilities.length > 0) {
                await this.insertHeroAbilities(client, req.tokenId, heroMetadata.abilities);
            }

            // Insert hero S abilities
            if (heroMetadata.abilitiesHeroS.length > 0) {
                await this.insertHeroSAbilities(client, req.tokenId, heroMetadata.abilitiesHeroS);
            }

            // Handle status-specific logic
            if (req.status === TX_STATUS.SOLD) {
                // Delete previous listing orders when sold
                await this.softDeleteListingOrders(client, req.tokenId, req.blockNumber);
            } else if (req.status === TX_STATUS.LISTING) {
                // Prune old listing orders (keep only the latest)
                await this.pruneOldListingOrders(client, req.tokenId);
            }

            // Fetch and return the created record
            const fetchedRecord = await this.getByIdWithClient(client, heroOrderId);
            if (!fetchedRecord) {
                throw new Error(`Failed to fetch created hero order with id ${heroOrderId}`);
            }
            return fetchedRecord;
        });
    }

    async filter(context: HeroTxFilterContext): Promise<HeroTxListRepr> {
        const qb = this.buildFilterQuery(context);
        const {sql, params} = qb.build();
        const countQuery = this.buildFilterCountQuery(context);

        // Execute both queries in parallel
        const [dataResult, countResult] = await Promise.all([
            this.db.query<HeroOrderRow>(sql, params),
            this.db.query<{ count: number }>(countQuery.sql, countQuery.params),
        ]);

        const transactions = dataResult.rows.map(rowToHeroTxRepr);
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

    async getById(id: number): Promise<HeroTxRepr | null> {
        const sql = `SELECT ${HERO_SELECT_COLUMNS} FROM hero_orders WHERE id = $1 AND deleted = false`;
        const result = await this.db.query<HeroOrderRow>(sql, [id]);
        if (result.rows.length === 0) return null;
        return rowToHeroTxRepr(result.rows[0]);
    }

    async getByTokenId(tokenId: string): Promise<HeroTxRepr | null> {
        const sql = `
      SELECT ${HERO_SELECT_COLUMNS}
      FROM hero_orders
      WHERE token_id = $1 AND deleted = false
      ORDER BY block_number DESC
      LIMIT 1
    `;
        const result = await this.db.query<HeroOrderRow>(sql, [tokenId]);
        if (result.rows.length === 0) return null;
        return rowToHeroTxRepr(result.rows[0]);
    }

    async deleteCreateOrder(tokenId: string, blockNumber: number): Promise<void> {
        const sql = `
      UPDATE hero_orders
      SET deleted = true, updated_at = NOW()
      WHERE token_id = $1 AND status = 'listing' AND block_number <= $2
    `;
        await this.db.query(sql, [tokenId, blockNumber]);
    }

    async deleteAllCreateOrders(tokenId: string): Promise<void> {
        const sql = `
      UPDATE hero_orders
      SET deleted = true, updated_at = NOW()
      WHERE token_id = $1 AND status = 'listing'
    `;
        await this.db.query(sql, [tokenId]);
    }

    async countOrders(orderType: string, windowHours: number): Promise<number> {
        const sql = `
      SELECT COUNT(*)::int as count
      FROM hero_orders
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
      FROM hero_orders
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
      FROM hero_orders
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
      FROM hero_orders
      WHERE status = 'sold'
        AND deleted = false
        AND LOWER(pay_token) = 'sen'
        AND updated_at >= NOW() - INTERVAL '1 hour' * $1
    `;
        const result = await this.db.query<{ volume: string }>(sql, [windowHours]);
        return result.rows[0]?.volume ?? '0';
    }

    async countByFilter(context: HeroTxFilterContext): Promise<number> {
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

    private async insertHeroAbilities(
        client: PoolClient,
        heroTokenId: string,
        abilities: number[]
    ): Promise<void> {
        if (abilities.length === 0) return;

        // Build multi-value insert
        const values: unknown[] = [];
        const placeholders: string[] = [];

        abilities.forEach((ability, i) => {
            const offset = i * 2;
            placeholders.push(`($${offset + 1}, $${offset + 2})`);
            values.push(heroTokenId, ability);
        });

        const sql = `
      INSERT INTO hero_abilities (hero_token_id, ability_token_id)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (hero_token_id, ability_token_id) DO UPDATE SET updated_at = NOW()
    `;

        await client.query(sql, values);
    }

    private async insertHeroSAbilities(
        client: PoolClient,
        heroTokenId: string,
        abilities: number[]
    ): Promise<void> {
        if (abilities.length === 0) return;

        // Build multi-value insert
        const values: unknown[] = [];
        const placeholders: string[] = [];

        abilities.forEach((ability, i) => {
            const offset = i * 2;
            placeholders.push(`($${offset + 1}, $${offset + 2})`);
            values.push(heroTokenId, ability);
        });

        const sql = `
      INSERT INTO hero_s_abilities (hero_token_id, ability_token_id)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (hero_token_id, ability_token_id) DO UPDATE SET updated_at = NOW()
    `;

        await client.query(sql, values);
    }

    private async softDeleteListingOrders(
        client: PoolClient,
        tokenId: string,
        blockNumber: number
    ): Promise<void> {
        const sql = `
      UPDATE hero_orders
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
      UPDATE hero_orders
      SET deleted = true, updated_at = NOW()
      WHERE token_id = $1
        AND status = 'listing'
        AND block_number < (
          SELECT MAX(block_number) FROM hero_orders
          WHERE token_id = $1 AND status = 'listing'
        )
    `;
        await client.query(sql, [tokenId]);
    }

    private async getByIdWithClient(client: PoolClient, id: number): Promise<HeroTxRepr | null> {
        const sql = `SELECT ${HERO_SELECT_COLUMNS} FROM hero_orders WHERE id = $1 AND deleted = false`;
        const result = await client.query<HeroOrderRow>(sql, [id]);
        if (result.rows.length === 0) return null;
        return rowToHeroTxRepr(result.rows[0]);
    }

    private buildFilterQuery(context: HeroTxFilterContext) {
        const qb = createQueryBuilder()
            .select(HERO_SELECT_COLUMNS)
            .from('hero_orders');

        this.applyFilterConditions(qb, context);
        qb.paginate(context);

        return qb;
    }

    private buildFilterCountQuery(context: HeroTxFilterContext) {
        const qb = createQueryBuilder().from('hero_orders');
        this.applyFilterConditions(qb, context);
        return qb.buildCount();
    }

    private applyFilterConditions(
        qb: ReturnType<typeof createQueryBuilder>,
        context: HeroTxFilterContext
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

        // RHS range filters for level
        if (context.level.length > 0) {
            const levelOps = parseRhsValues(context.level);
            const gte = levelOps.get('gte');
            const lte = levelOps.get('lte');
            if (gte !== undefined) qb.whereGte('level', parseInt(gte, 10));
            if (lte !== undefined) qb.whereLte('level', parseInt(lte, 10));
        }

        // RHS range filters for amount
        if (context.amount.length > 0) {
            const amountOps = parseRhsValues(context.amount);
            const gte = amountOps.get('gte');
            const lte = amountOps.get('lte');
            if (gte !== undefined) qb.whereGte('amount', gte);
            if (lte !== undefined) qb.whereLte('amount', lte);
        }

        // Simple GTE filters
        if (context.stamina > 0) qb.whereGte('stamina', context.stamina);
        if (context.speed > 0) qb.whereGte('speed', context.speed);
        if (context.bombPower > 0) qb.whereGte('bomb_power', context.bombPower);
        if (context.bombCount > 0) qb.whereGte('bomb_count', context.bombCount);
        if (context.bombRange > 0) qb.whereGte('bomb_range', context.bombRange);

        // Abilities filter (OR conditions)
        if (context.abilities.length > 0) {
            const orConditions = context.abilities
                .sort((a, b) => a - b)
                .map(ability => `ability_${ability} = true`);
            qb.whereOr(orConditions);
        }

        // Hero S abilities filter (stored as string, use LIKE or equality)
        if (context.abilitiesHeroS.length > 0) {
            // For Hero S abilities, we check if they exist in the abilities_hero_s string
            const orConditions = context.abilitiesHeroS.map(
                ability => `abilities_hero_s LIKE '%${ability}%'`
            );
            qb.whereOr(orConditions);
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
export function createHeroTransactionRepository(
    db: DatabasePool,
    logger: Logger
): IHeroTransactionRepository {
    return new HeroTransactionRepository(db, logger);
}
