import {DatabasePool} from '@/infrastructure/database/postgres';
import {Logger} from '@/utils/logger';
import {
    HeroDetail,
    HeroStakeRankingFilter,
    HeroStakeRankingResult,
    HouseDetail,
    parseAbilities,
    RankedHero,
    StakeToken,
    StakeTokenType,
    WalletHeroesFilter,
    WalletHeroesResult,
    WalletProfile,
    WalletStakeRankingFilter,
    WalletStakeRankingResult,
} from '@/domain/models/ranking';

/**
 * FI heroes only: type 2 rows are non-NFT "traditional mode" heroes and
 * hasDelete = 1 means the hero left the wallet (sold/transferred).
 * $1 is always a text[] of data_type values - one network normally, both
 * on the consolidated rankings.
 */
const HERO_BASE_WHERE = `b.type = 0 AND b.data_type = ANY ($1) AND b."hasDelete" = 0`;

/** Networks the consolidated rankings sum over. */
const ALL_NETWORKS = ['BSC', 'POLYGON'];

const HERO_COLUMNS = `
    b.data_type              AS network,
    b.bomber_id::int         AS bomber_id,
    b.rare                   AS rarity,
    b.level                  AS level,
    b.power                  AS power,
    b.stamina                AS stamina,
    b.speed                  AS speed,
    b.bomb                   AS bomb_count,
    b.bomb_range             AS bomb_range,
    b.ability                AS ability,
    b.charactor              AS skin,
    b.color                  AS color,
    b.stake_amount::float8   AS stake_bcoin,
    b.stake_sen::float8      AS stake_sen`;

interface HeroRow {
    network: string;
    bomber_id: number;
    rarity: number;
    level: number;
    power: number;
    stamina: number;
    speed: number;
    bomb_count: number;
    bomb_range: number;
    ability: string | null;
    skin: number;
    color: number;
    stake_bcoin: number;
    stake_sen: number;
    wallet: string | null;
}

function toRankedHero(row: HeroRow, rank: number | null): RankedHero {
    return {
        rank,
        network: row.network,
        bomber_id: row.bomber_id,
        rarity: row.rarity,
        level: row.level,
        power: row.power,
        stamina: row.stamina,
        speed: row.speed,
        bomb_count: row.bomb_count,
        bomb_range: row.bomb_range,
        abilities: parseAbilities(row.ability),
        skin: row.skin,
        color: row.color,
        stake_bcoin: row.stake_bcoin,
        stake_sen: row.stake_sen,
        wallet: row.wallet,
    };
}

/** Column holding the stake of the ordering token. Not user input. */
function stakeColumn(token: StakeTokenType): string {
    return token === StakeToken.SEN ? 'b.stake_sen' : 'b.stake_amount';
}

export interface IRankingRepository {
    getHeroRanking(filter: HeroStakeRankingFilter): Promise<HeroStakeRankingResult>;

    getWalletRanking(filter: WalletStakeRankingFilter): Promise<WalletStakeRankingResult>;

    getWalletProfile(wallet: string, network?: string, consolidated?: boolean): Promise<WalletProfile | null>;

    getWalletHeroes(wallet: string, filter: WalletHeroesFilter): Promise<WalletHeroesResult | null>;

    getHeroById(bomberId: number, network?: string): Promise<HeroDetail | null>;

    getHouseById(houseId: number, network?: string): Promise<HouseDetail | null>;
}

/**
 * Stake rankings + explorer data access.
 *
 * Reads the GAME database (bombcrypto2), the same pool the house rental
 * module uses. `network` is the resolved user_bomber.data_type value
 * ('BSC' | 'POLYGON'), fixed per API instance like the rest of the service.
 */
export function createRankingRepository(
    gameDb: DatabasePool,
    defaultNetwork: string,
    logger: Logger
): IRankingRepository {
    /**
     * Network the query runs on. The game database holds every network in the
     * same tables (data_type), so a single instance can answer for any of
     * them; callers pass the network the user selected and the instance's own
     * network is only the fallback.
     */
    const pick = (network?: string): string => network ?? defaultNetwork;

    async function findUidByWallet(wallet: string): Promise<{ uid: number; wallet: string } | null> {
        // user_name is the wallet address for FI accounts (stored lowercase)
        const res = await gameDb.query<{ id_user: number; user_name: string }>(
            'SELECT id_user, user_name FROM public."user" WHERE user_name = LOWER($1) LIMIT 1',
            [wallet]
        );
        return res.rowCount ? {uid: res.rows[0].id_user, wallet: res.rows[0].user_name} : null;
    }

    return {
        async getHeroRanking(filter: HeroStakeRankingFilter): Promise<HeroStakeRankingResult> {
            const col = stakeColumn(filter.token);
            const networks = filter.consolidated ? ALL_NETWORKS : [pick(filter.network)];
            const params: unknown[] = [networks, filter.rarity];
            const where = `${HERO_BASE_WHERE} AND ($2::int IS NULL OR b.rare = $2) AND ${col} > 0`;

            const summaryRes = await gameDb.query<{
                stake_bcoin: number;
                stake_sen: number;
                heroes: number;
                biggest_stake: number;
                avg_stake: number;
            }>(
                `SELECT COALESCE(SUM(b.stake_amount), 0)::float8 AS stake_bcoin,
                        COALESCE(SUM(b.stake_sen), 0)::float8    AS stake_sen,
                        COUNT(*)::int                            AS heroes,
                        COALESCE(MAX(${col}), 0)::float8         AS biggest_stake,
                        COALESCE(AVG(${col}), 0)::float8         AS avg_stake
                 FROM public.user_bomber b
                 WHERE ${where}`,
                params
            );

            const offset = (filter.page - 1) * filter.size;
            const itemsRes = await gameDb.query<HeroRow>(
                `SELECT ${HERO_COLUMNS}, u.user_name AS wallet
                 FROM public.user_bomber b
                          LEFT JOIN public."user" u ON u.id_user = b.uid
                 WHERE ${where}
                 ORDER BY ${col} DESC, b.bomber_id ASC, b.data_type ASC
                 LIMIT $3 OFFSET $4`,
                [...params, filter.size, offset]
            );

            return {
                summary: summaryRes.rows[0],
                total_count: summaryRes.rows[0].heroes,
                items: itemsRes.rows.map((row, i) => toRankedHero(row, offset + i + 1)),
            };
        },

        async getWalletRanking(filter: WalletStakeRankingFilter): Promise<WalletStakeRankingResult> {
            const sumCol = filter.token === StakeToken.SEN ? 'stake_sen' : 'stake_bcoin';
            const stakedCol = filter.token === StakeToken.SEN ? 'b.stake_sen' : 'b.stake_amount';
            const networks = filter.consolidated ? ALL_NETWORKS : [pick(filter.network)];
            // A wallet's stake sum over all its heroes equals the sum over its
            // STAKED heroes, so the aggregation only touches rows with stake >
            // 0 (tiny partial index) instead of grouping the whole table.
            const walletsCte = `
                SELECT b.uid,
                       COUNT(*) FILTER (WHERE ${stakedCol} > 0)::int AS heroes_staked,
                       COALESCE(SUM(b.stake_amount), 0)::float8 AS stake_bcoin,
                       COALESCE(SUM(b.stake_sen), 0)::float8    AS stake_sen
                FROM public.user_bomber b
                WHERE ${HERO_BASE_WHERE}
                  AND (b.stake_amount > 0 OR b.stake_sen > 0)
                GROUP BY b.uid`;

            const summaryRes = await gameDb.query<{
                stake_bcoin: number;
                stake_sen: number;
                wallets: number;
                biggest_stake: number;
                avg_stake: number;
            }>(
                `WITH wallets AS (${walletsCte})
                 SELECT COALESCE(SUM(stake_bcoin), 0)::float8 AS stake_bcoin,
                        COALESCE(SUM(stake_sen), 0)::float8   AS stake_sen,
                        COUNT(*)::int                         AS wallets,
                        COALESCE(MAX(${sumCol}), 0)::float8   AS biggest_stake,
                        COALESCE(AVG(${sumCol}), 0)::float8   AS avg_stake
                 FROM wallets
                 WHERE ${sumCol} > 0`,
                [networks]
            );

            const offset = (filter.page - 1) * filter.size;
            const itemsRes = await gameDb.query<{
                uid: number;
                wallet: string;
                heroes_staked: number;
                stake_bcoin: number;
                stake_sen: number;
            }>(
                `WITH wallets AS (${walletsCte}),
                      page AS (SELECT *
                               FROM wallets w
                               WHERE w.${sumCol} > 0
                               ORDER BY w.${sumCol} DESC, w.uid ASC
                               LIMIT $2 OFFSET $3)
                 SELECT p.uid, COALESCE(u.user_name, '') AS wallet, p.heroes_staked, p.stake_bcoin, p.stake_sen
                 FROM page p
                          LEFT JOIN public."user" u ON u.id_user = p.uid
                 ORDER BY p.${sumCol} DESC, p.uid ASC`,
                [networks, filter.size, offset]
            );

            // Total heroes owned, only for the wallets on this page
            const heroesByUid = new Map<number, number>();
            if (itemsRes.rowCount) {
                const totalsRes = await gameDb.query<{ uid: number; heroes: number }>(
                    `SELECT b.uid, COUNT(*)::int AS heroes
                     FROM public.user_bomber b
                     WHERE ${HERO_BASE_WHERE}
                       AND b.uid = ANY ($2)
                     GROUP BY b.uid`,
                    [networks, itemsRes.rows.map((row) => row.uid)]
                );
                totalsRes.rows.forEach((row) => heroesByUid.set(row.uid, row.heroes));
            }

            return {
                summary: summaryRes.rows[0],
                total_count: summaryRes.rows[0].wallets,
                items: itemsRes.rows.map((row, i) => ({
                    rank: offset + i + 1,
                    wallet: row.wallet,
                    heroes: heroesByUid.get(row.uid) ?? row.heroes_staked,
                    heroes_staked: row.heroes_staked,
                    stake_bcoin: row.stake_bcoin,
                    stake_sen: row.stake_sen,
                })),
            };
        },

        async getWalletProfile(wallet: string, network?: string, consolidated = false): Promise<WalletProfile | null> {
            const user = await findUidByWallet(wallet);
            if (!user) return null;
            // Same scope as the ranking the user came from, so the position
            // shown here matches the one on the list
            const scope = consolidated ? ALL_NETWORKS : [pick(network)];

            const countersRes = await gameDb.query<{
                heroes: number;
                heroes_staked: number;
                stake_bcoin: number;
                stake_sen: number;
            }>(
                `SELECT COUNT(*)::int                                                      AS heroes,
                        COUNT(*) FILTER (WHERE b.stake_amount > 0 OR b.stake_sen > 0)::int AS heroes_staked,
                        COALESCE(SUM(b.stake_amount), 0)::float8                           AS stake_bcoin,
                        COALESCE(SUM(b.stake_sen), 0)::float8                              AS stake_sen
                 FROM public.user_bomber b
                 WHERE ${HERO_BASE_WHERE}
                   AND b.uid = $2`,
                [scope, user.uid]
            );
            const counters = countersRes.rows[0];

            const housesRes = await gameDb.query<{
                house_id: number;
                rarity: number;
                recovery: number;
                max_bomber: number;
                active: number;
            }>(
                `SELECT house_id::int          AS house_id,
                        COALESCE(rarity, 0)    AS rarity,
                        COALESCE(recovery, 0)  AS recovery,
                        COALESCE(max_bomber, 0) AS max_bomber,
                        COALESCE(active, 0)    AS active
                 FROM public.user_house
                 WHERE uid = $2
                   AND type = ANY ($1)
                 ORDER BY rarity DESC NULLS LAST, house_id ASC`,
                [scope, user.uid]
            );

            // Position among staking wallets, per token (1 + wallets above
            // us). Only rows with stake > 0 matter for the sums, which keeps
            // this on the tiny partial index.
            // Same ordering as the wallet ranking list (sum DESC, uid ASC),
            // so tied wallets get their real position instead of all sharing
            // the first one.
            const rankFor = async (sumCol: string, myStake: number): Promise<number | null> => {
                if (myStake <= 0) return null;
                // `me` is summed in this very query: comparing against a total
                // aggregated elsewhere could miss an exact tie by one float ulp
                const res = await gameDb.query<{ rank: number }>(
                    `WITH totals AS (SELECT b.uid, SUM(${sumCol}) AS total
                                     FROM public.user_bomber b
                                     WHERE ${HERO_BASE_WHERE}
                                       AND ${sumCol} > 0
                                     GROUP BY b.uid),
                          me AS (SELECT total FROM totals WHERE uid = $2)
                     SELECT COUNT(*)::int + 1 AS rank
                     FROM totals t, me
                     WHERE t.total > me.total
                        OR (t.total = me.total AND t.uid < $2)`,
                    [scope, user.uid]
                );
                return res.rows[0].rank;
            };

            const [rankBcoin, rankSen] = await Promise.all([
                rankFor('b.stake_amount', counters.stake_bcoin),
                rankFor('b.stake_sen', counters.stake_sen),
            ]);

            return {
                wallet: user.wallet,
                heroes: counters.heroes,
                heroes_staked: counters.heroes_staked,
                stake_bcoin: counters.stake_bcoin,
                stake_sen: counters.stake_sen,
                rank_bcoin: rankBcoin,
                rank_sen: rankSen,
                houses: housesRes.rows,
            };
        },

        async getWalletHeroes(wallet: string, filter: WalletHeroesFilter): Promise<WalletHeroesResult | null> {
            const user = await findUidByWallet(wallet);
            if (!user) return null;
            const scope = [pick(filter.network)];

            const stakedWhere = filter.stakedOnly ? 'AND (b.stake_amount > 0 OR b.stake_sen > 0)' : '';
            const where = `${HERO_BASE_WHERE} AND b.uid = $2 ${stakedWhere}`;

            const countRes = await gameDb.query<{ total: number }>(
                `SELECT COUNT(*)::int AS total
                 FROM public.user_bomber b
                 WHERE ${where}`,
                [scope, user.uid]
            );

            const offset = (filter.page - 1) * filter.size;
            const itemsRes = await gameDb.query<HeroRow>(
                `SELECT ${HERO_COLUMNS}, LOWER($3) AS wallet
                 FROM public.user_bomber b
                 WHERE ${where}
                 ORDER BY b.stake_amount DESC, b.stake_sen DESC, b.rare DESC, b.bomber_id ASC
                 LIMIT $4 OFFSET $5`,
                [scope, user.uid, user.wallet, filter.size, offset]
            );

            return {
                total_count: countRes.rows[0].total,
                items: itemsRes.rows.map((row) => toRankedHero(row, null)),
            };
        },

        async getHeroById(bomberId: number, network?: string): Promise<HeroDetail | null> {
            const heroRes = await gameDb.query<HeroRow & { has_delete: number; shield_level: number; rarity: number }>(
                `SELECT ${HERO_COLUMNS},
                        b."hasDelete"   AS has_delete,
                        b.shield_level  AS shield_level,
                        u.user_name     AS wallet
                 FROM public.user_bomber b
                          LEFT JOIN public."user" u ON u.id_user = b.uid
                 WHERE b.bomber_id = $2
                   AND b.type = 0
                   AND b.data_type = $1
                 LIMIT 1`,
                [pick(network), bomberId]
            );
            if (!heroRes.rowCount) return null;
            const row = heroRes.rows[0];

            // Ranking positions among currently staked heroes, per token:
            // within the hero's network (overall and within the rarity) and
            // global (consolidated across all networks). One scan over the
            // staked partial indexes; the network scope comes from FILTER.
            // "Ahead of this hero" uses the very same ordering as the ranking
            // list (stake DESC, bomber_id ASC, data_type ASC), so a hero tied
            // with others gets the exact position it occupies on the list -
            // counting only bigger stakes would show every tied hero as #1.
            const aheadBcoin = `(b.stake_amount > $2 OR (b.stake_amount = $2 AND (b.bomber_id < $6 OR (b.bomber_id = $6 AND b.data_type < $5))))`;
            const aheadSen = `(b.stake_sen > $3 OR (b.stake_sen = $3 AND (b.bomber_id < $6 OR (b.bomber_id = $6 AND b.data_type < $5))))`;
            const ranksRes = await gameDb.query<{
                rank_bcoin: number;
                rank_bcoin_rarity: number;
                rank_bcoin_global: number;
                rank_bcoin_global_rarity: number;
                rank_sen: number;
                rank_sen_rarity: number;
                rank_sen_global: number;
                rank_sen_global_rarity: number;
            }>(
                `SELECT COUNT(*) FILTER (WHERE b.data_type = $5 AND ${aheadBcoin})::int + 1                  AS rank_bcoin,
                        COUNT(*) FILTER (WHERE b.data_type = $5 AND ${aheadBcoin} AND b.rare = $4)::int + 1 AS rank_bcoin_rarity,
                        COUNT(*) FILTER (WHERE ${aheadBcoin})::int + 1                                      AS rank_bcoin_global,
                        COUNT(*) FILTER (WHERE ${aheadBcoin} AND b.rare = $4)::int + 1                      AS rank_bcoin_global_rarity,
                        COUNT(*) FILTER (WHERE b.data_type = $5 AND ${aheadSen})::int + 1                    AS rank_sen,
                        COUNT(*) FILTER (WHERE b.data_type = $5 AND ${aheadSen} AND b.rare = $4)::int + 1    AS rank_sen_rarity,
                        COUNT(*) FILTER (WHERE ${aheadSen})::int + 1                                         AS rank_sen_global,
                        COUNT(*) FILTER (WHERE ${aheadSen} AND b.rare = $4)::int + 1                         AS rank_sen_global_rarity
                 FROM public.user_bomber b
                 WHERE ${HERO_BASE_WHERE}`,
                [ALL_NETWORKS, row.stake_bcoin, row.stake_sen, row.rarity, row.network, row.bomber_id]
            );
            const ranks = ranksRes.rows[0];
            const isRanked = !row.has_delete;

            // Heroes leave the inventory by sale, transfer or burn; the burn
            // (create rock) leaves a record with the hero id in the jsonb list
            let burned = false;
            if (row.has_delete) {
                const burnedRes = await gameDb.query<{ burned: boolean }>(
                    `SELECT EXISTS (SELECT 1
                                    FROM public.user_create_rock
                                    WHERE network = $1
                                      AND status = 'DONE'
                                      AND heroes @> to_jsonb($2::bigint)) AS burned`,
                    [row.network, bomberId]
                );
                burned = burnedRes.rows[0].burned;
            }

            return {
                ...toRankedHero(row, null),
                has_delete: !!row.has_delete,
                burned,
                shield_level: row.shield_level,
                rank_bcoin: isRanked && row.stake_bcoin > 0 ? ranks.rank_bcoin : null,
                rank_bcoin_rarity: isRanked && row.stake_bcoin > 0 ? ranks.rank_bcoin_rarity : null,
                rank_bcoin_global: isRanked && row.stake_bcoin > 0 ? ranks.rank_bcoin_global : null,
                rank_bcoin_global_rarity: isRanked && row.stake_bcoin > 0 ? ranks.rank_bcoin_global_rarity : null,
                rank_sen: isRanked && row.stake_sen > 0 ? ranks.rank_sen : null,
                rank_sen_rarity: isRanked && row.stake_sen > 0 ? ranks.rank_sen_rarity : null,
                rank_sen_global: isRanked && row.stake_sen > 0 ? ranks.rank_sen_global : null,
                rank_sen_global_rarity: isRanked && row.stake_sen > 0 ? ranks.rank_sen_global_rarity : null,
            };
        },

        async getHouseById(houseId: number, network?: string): Promise<HouseDetail | null> {
            const res = await gameDb.query<HouseDetail>(
                `SELECT h.house_id::int           AS house_id,
                        COALESCE(h.rarity, 0)     AS rarity,
                        COALESCE(h.recovery, 0)   AS recovery,
                        COALESCE(h.max_bomber, 0) AS max_bomber,
                        COALESCE(h.active, 0)     AS active,
                        u.user_name               AS wallet
                 FROM public.user_house h
                          LEFT JOIN public."user" u ON u.id_user = h.uid
                 WHERE h.house_id = $2
                   AND h.type = $1
                 LIMIT 1`,
                [pick(network), houseId]
            );
            if (!res.rowCount) {
                logger.debug(`House ${houseId} not found on ${pick(network)}`);
                return null;
            }
            return res.rows[0];
        },
    };
}
