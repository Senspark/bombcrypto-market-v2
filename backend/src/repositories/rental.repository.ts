import {DatabasePool} from '@/infrastructure/database/postgres';
import {Logger} from '@/utils/logger';
import {
    ListingStatus,
    RentalBalance,
    RentalListingFilter,
    RentalListingRow,
    RentalPaymentRow,
    RentalRow,
    RentalStatus,
} from '@/domain/models/rental';

/** House columns the marketplace UI shows on each listing card. */
const HOUSE_COLUMNS = 'h.rarity, h.recovery, h.max_bomber, h.gen_house_id';

export interface OwnerEarning {
    pay_token: string;
    total: number;
}

export interface IRentalRepository {
    findUidByWallet(wallet: string): Promise<number | null>;

    findWalletByUid(uid: number): Promise<string | null>;

    getGameConfig(keys: string[]): Promise<Map<string, string>>;

    findHouse(houseId: number, network: string): Promise<{ uid: number | null; rarity: number | null } | null>;

    browseListings(filter: RentalListingFilter): Promise<{ rows: RentalListingRow[]; total: number }>;

    findListingById(listingId: number): Promise<RentalListingRow | null>;

    findListingsByOwner(ownerUid: number, network: string): Promise<RentalListingRow[]>;

    findUnlistedHouses(ownerUid: number, network: string): Promise<RentalListingRow[]>;

    createListing(houseId: number, network: string, ownerUid: number, pricePerDay: number,
                  payToken: string): Promise<string>;

    updateListingPrice(listingId: number, pricePerDay: number): Promise<void>;

    cancelListing(listingId: number): Promise<void>;

    rentHouse(listingId: number, renterUid: number, numDays: number, fee: number,
              maxDays: number): Promise<string>;

    chargeRentalDay(rentalId: string, fee: number): Promise<number>;

    /** Ends the contract right away and charges the penalty; returns the amount charged. */
    cancelRental(rentalId: string, renterUid: number, feeOwner: number, feeGame: number): Promise<number>;

    findActiveRentalByRenter(renterUid: number, network: string): Promise<RentalRow | null>;

    findActiveRentalByHouse(houseId: number, network: string): Promise<RentalRow | null>;

    findRentalsDueForCharge(limit: number): Promise<RentalRow[]>;

    endRental(rentalId: string, status: string, releaseListing: boolean): Promise<void>;

    markInterruptedBySale(rentalId: string): Promise<void>;

    getOwnerEarnings(ownerUid: number, network: string): Promise<OwnerEarning[]>;

    getRentalPayments(rentalId: string): Promise<RentalPaymentRow[]>;

    getUserBalance(uid: number, network: string): Promise<RentalBalance>;
}

/**
 * Rental data access.
 *
 * Two separate databases on the same Postgres instance:
 *  - gameDb:    bombcrypto2 - houses, in-game balance and the rental tables
 *  - accountDb: backend     - read-only, resolves wallet <-> uid
 *
 * Note this is NOT the marketplace database used by the rest of this service:
 * rentals are paid with in-game balance, so they live where that balance lives.
 */
export function createRentalRepository(
    gameDb: DatabasePool,
    accountDb: DatabasePool,
    logger: Logger
): IRentalRepository {
    return {
        async findUidByWallet(wallet: string): Promise<number | null> {
            // bomberland.users has UNIQUE(address): one wallet = one account.
            const res = await accountDb.query<{ id: number }>(
                'SELECT id FROM bomberland.users WHERE LOWER(address) = LOWER($1) LIMIT 1',
                [wallet]
            );
            return res.rowCount ? res.rows[0].id : null;
        },

        async findWalletByUid(uid: number): Promise<string | null> {
            const res = await accountDb.query<{ address: string | null }>(
                'SELECT address FROM bomberland.users WHERE id = $1 LIMIT 1',
                [uid]
            );
            const address = res.rowCount ? res.rows[0].address : null;
            return address ? address.toLowerCase() : null;
        },

        async getGameConfig(keys: string[]): Promise<Map<string, string>> {
            const res = await gameDb.query<{ key: string; value: string }>(
                'SELECT key, value FROM public.game_config WHERE key = ANY($1)',
                [keys]
            );
            const map = new Map<string, string>();
            res.rows.forEach((row) => map.set(row.key, row.value));
            return map;
        },

        async findHouse(houseId: number, network: string) {
            const res = await gameDb.query<{ uid: number | null; rarity: number | null }>(
                'SELECT uid, rarity FROM public.user_house WHERE house_id = $1 AND type = $2',
                [houseId, network]
            );
            return res.rowCount ? {uid: res.rows[0].uid, rarity: res.rows[0].rarity} : null;
        },

        async browseListings(filter: RentalListingFilter) {
            const params: unknown[] = [filter.network];
            const where: string[] = ['l.type = $1', `l.status = '${ListingStatus.AVAILABLE}'`];

            if (filter.rarities.length > 0) {
                params.push(filter.rarities);
                where.push(`h.rarity = ANY($${params.length})`);
            }
            if (filter.payTokens.length > 0) {
                params.push(filter.payTokens);
                where.push(`l.pay_token = ANY($${params.length})`);
            }
            if (filter.minPrice !== undefined) {
                params.push(filter.minPrice);
                where.push(`l.price_per_day >= $${params.length}`);
            }
            if (filter.maxPrice !== undefined) {
                params.push(filter.maxPrice);
                where.push(`l.price_per_day <= $${params.length}`);
            }

            const whereSql = where.join(' AND ');
            // sortColumn comes from the RENTAL_SORT_COLUMNS whitelist
            const orderSql = `${filter.sortColumn} ${filter.sortDesc ? 'DESC' : 'ASC'}, l.id ASC`;

            const countRes = await gameDb.query<{ total: number }>(
                `SELECT COUNT(*)::int AS total
                 FROM public.house_rental_listing l
                          JOIN public.user_house h ON h.house_id = l.house_id AND h.type = l.type
                 WHERE ${whereSql}`,
                params
            );

            params.push(filter.limit);
            const limitIdx = params.length;
            params.push(filter.offset);
            const offsetIdx = params.length;

            const res = await gameDb.query<RentalListingRow>(
                `SELECT l.id, l.house_id, l.type, l.owner_uid, l.price_per_day, l.pay_token, l.status, l.created_at,
                        ${HOUSE_COLUMNS}
                 FROM public.house_rental_listing l
                          JOIN public.user_house h ON h.house_id = l.house_id AND h.type = l.type
                 WHERE ${whereSql}
                 ORDER BY ${orderSql}
                 LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
                params
            );

            return {rows: res.rows, total: countRes.rows[0].total};
        },

        async findListingById(listingId: number): Promise<RentalListingRow | null> {
            const res = await gameDb.query<RentalListingRow>(
                `SELECT l.id, l.house_id, l.type, l.owner_uid, l.price_per_day, l.pay_token, l.status, l.created_at,
                        ${HOUSE_COLUMNS}
                 FROM public.house_rental_listing l
                          LEFT JOIN public.user_house h ON h.house_id = l.house_id AND h.type = l.type
                 WHERE l.id = $1`,
                [listingId]
            );
            return res.rowCount ? res.rows[0] : null;
        },

        async findListingsByOwner(ownerUid: number, network: string): Promise<RentalListingRow[]> {
            const res = await gameDb.query<RentalListingRow>(
                `SELECT l.id, l.house_id, l.type, l.owner_uid, l.price_per_day, l.pay_token, l.status, l.created_at,
                        ${HOUSE_COLUMNS}
                 FROM public.house_rental_listing l
                          LEFT JOIN public.user_house h ON h.house_id = l.house_id AND h.type = l.type
                 WHERE l.owner_uid = $1
                   AND l.type = $2
                   AND l.status <> '${ListingStatus.CANCELLED}'
                 ORDER BY l.created_at DESC`,
                [ownerUid, network]
            );
            return res.rows;
        },

        async findUnlistedHouses(ownerUid: number, network: string): Promise<RentalListingRow[]> {
            const res = await gameDb.query<RentalListingRow>(
                `SELECT NULL::bigint AS id, h.house_id, h.type, h.uid AS owner_uid,
                        NULL::double precision AS price_per_day, NULL::varchar AS pay_token,
                        'NOT_LISTED'::varchar AS status, NULL::timestamptz AS created_at,
                        ${HOUSE_COLUMNS}
                 FROM public.user_house h
                 WHERE h.uid = $1
                   AND h.type = $2
                   AND NOT EXISTS (SELECT 1
                                   FROM public.house_rental_listing l
                                   WHERE l.house_id = h.house_id
                                     AND l.type = h.type
                                     AND l.status IN ('${ListingStatus.AVAILABLE}', '${ListingStatus.RENTED}'))
                 ORDER BY h.house_id`,
                [ownerUid, network]
            );
            return res.rows;
        },

        async createListing(houseId, network, ownerUid, pricePerDay, payToken): Promise<string> {
            const res = await gameDb.query<{ id: string }>(
                `INSERT INTO public.house_rental_listing (house_id, type, owner_uid, price_per_day, pay_token, status)
                 VALUES ($1, $2, $3, $4, $5, '${ListingStatus.AVAILABLE}')
                 RETURNING id`,
                [houseId, network, ownerUid, pricePerDay, payToken]
            );
            return res.rows[0].id;
        },

        async updateListingPrice(listingId: number, pricePerDay: number): Promise<void> {
            await gameDb.query(
                `UPDATE public.house_rental_listing
                 SET price_per_day = $2, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND status = '${ListingStatus.AVAILABLE}'`,
                [listingId, pricePerDay]
            );
        },

        async cancelListing(listingId: number): Promise<void> {
            await gameDb.query(
                `UPDATE public.house_rental_listing
                 SET status = '${ListingStatus.CANCELLED}', updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [listingId]
            );
        },

        async rentHouse(listingId, renterUid, numDays, fee, maxDays): Promise<string> {
            // Charges day 1 upfront and creates the contract in a single transaction
            const res = await gameDb.query<{ _rental_id: string }>(
                'CALL public.sp_rent_house_p2p($1, $2, $3, $4, $5, NULL)',
                [listingId, renterUid, numDays, fee, maxDays]
            );
            return res.rows[0]._rental_id;
        },

        async chargeRentalDay(rentalId: string, fee: number): Promise<number> {
            const res = await gameDb.query<{ _day_number: number }>(
                'CALL public.sp_charge_house_rent_day($1, $2, NULL)',
                [rentalId, fee]
            );
            return res.rows[0]._day_number;
        },

        async cancelRental(rentalId, renterUid, feeOwner, feeGame): Promise<number> {
            const res = await gameDb.query<{ _penalty: number }>(
                'CALL public.sp_cancel_house_rental($1, $2, $3, $4, NULL)',
                [rentalId, renterUid, feeOwner, feeGame]
            );
            return Number(res.rows[0]?._penalty ?? 0);
        },

        async findActiveRentalByRenter(renterUid: number, network: string): Promise<RentalRow | null> {
            const res = await gameDb.query<RentalRow>(
                `SELECT * FROM public.house_rental
                 WHERE renter_uid = $1 AND type = $2 AND status = '${RentalStatus.ACTIVE}'`,
                [renterUid, network]
            );
            return res.rowCount ? res.rows[0] : null;
        },

        async findActiveRentalByHouse(houseId: number, network: string): Promise<RentalRow | null> {
            const res = await gameDb.query<RentalRow>(
                `SELECT * FROM public.house_rental
                 WHERE house_id = $1 AND type = $2 AND status = '${RentalStatus.ACTIVE}'`,
                [houseId, network]
            );
            return res.rowCount ? res.rows[0] : null;
        },

        async findRentalsDueForCharge(limit: number): Promise<RentalRow[]> {
            const res = await gameDb.query<RentalRow>(
                `SELECT * FROM public.house_rental
                 WHERE status = '${RentalStatus.ACTIVE}'
                   AND current_period_end <= CURRENT_TIMESTAMP
                 ORDER BY current_period_end
                 LIMIT $1`,
                [limit]
            );
            return res.rows;
        },

        async endRental(rentalId: string, status: string, releaseListing: boolean): Promise<void> {
            const listingStatus = releaseListing ? ListingStatus.AVAILABLE : ListingStatus.CANCELLED;
            await gameDb.query(
                `WITH ended AS (
                     UPDATE public.house_rental
                         SET status = $2, ended_at = CURRENT_TIMESTAMP
                         WHERE id = $1 AND status = '${RentalStatus.ACTIVE}'
                         RETURNING listing_id)
                 UPDATE public.house_rental_listing
                 SET status = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE id = (SELECT listing_id FROM ended)`,
                [rentalId, status, listingStatus]
            );
        },

        async markInterruptedBySale(rentalId: string): Promise<void> {
            await gameDb.query(
                'UPDATE public.house_rental SET interrupted_by_sale = true WHERE id = $1',
                [rentalId]
            );
        },

        async getOwnerEarnings(ownerUid: number, network: string): Promise<OwnerEarning[]> {
            const res = await gameDb.query<OwnerEarning>(
                `SELECT pay_token, COALESCE(SUM(owner_amount), 0)::double precision AS total
                 FROM public.house_rental_payment
                 WHERE owner_uid = $1 AND type = $2
                 GROUP BY pay_token`,
                [ownerUid, network]
            );
            return res.rows;
        },

        async getRentalPayments(rentalId: string): Promise<RentalPaymentRow[]> {
            const res = await gameDb.query<RentalPaymentRow>(
                `SELECT day_number, amount, fee, owner_amount, pay_token, charged_at
                 FROM public.house_rental_payment
                 WHERE rental_id = $1
                 ORDER BY day_number`,
                [rentalId]
            );
            return res.rows;
        },

        async getUserBalance(uid: number, network: string): Promise<RentalBalance> {
            const res = await gameDb.query<{ reward_type: string; value: number }>(
                `SELECT reward_type, "values"::double precision AS value
                 FROM public.user_block_reward
                 WHERE uid = $1
                   AND type = $2
                   AND reward_type IN ('BCOIN', 'BCOIN_DEPOSITED', 'SENSPARK', 'SENSPARK_DEPOSITED')`,
                [uid, network]
            );

            const byType: Record<string, number> = {};
            res.rows.forEach((row) => (byType[row.reward_type] = Number(row.value) || 0));

            // The game spends deposited balance first and mined balance after, so
            // the amount usable for rent is the sum of both.
            return {
                BCOIN: (byType['BCOIN'] ?? 0) + (byType['BCOIN_DEPOSITED'] ?? 0),
                BCOIN_DEPOSITED: byType['BCOIN_DEPOSITED'] ?? 0,
                SEN: (byType['SENSPARK'] ?? 0) + (byType['SENSPARK_DEPOSITED'] ?? 0),
                SEN_DEPOSITED: byType['SENSPARK_DEPOSITED'] ?? 0,
            };
        },
    };
}
