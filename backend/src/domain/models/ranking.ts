/**
 * Stake rankings + wallet/hero/house explorer.
 *
 * All data comes from the GAME database (bombcrypto2): heroes live in
 * public.user_bomber with the current stake mirrored from the chain in
 * stake_amount (BCOIN) / stake_sen (SEN), and the owner wallet is
 * public."user".user_name. Only FI heroes count (type = 0) - type 2 are
 * non-NFT "traditional mode" heroes that share the same table.
 */

/** Maps the API network alias to the data_type/type column of the game DB. */
export const NETWORK_BY_ALIAS: Record<string, string> = {
    bsc: 'BSC',
    polygon: 'POLYGON',
    pol: 'POLYGON',
};

/** Token a stake ranking can be ordered by. */
export const StakeToken = {
    BCOIN: 'BCOIN',
    SEN: 'SEN',
} as const;

export type StakeTokenType = (typeof StakeToken)[keyof typeof StakeToken];

export function parseStakeToken(raw: unknown): StakeTokenType {
    const token = String(raw ?? '').toUpperCase();
    return token === StakeToken.SEN ? StakeToken.SEN : StakeToken.BCOIN;
}

/**
 * user_bomber.ability holds a JSON-ish list ("[1,4,2]"). Bad/legacy values
 * simply render as "no abilities" instead of failing the whole row.
 */
export function parseAbilities(raw: string | null): number[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(Number).filter((n) => Number.isFinite(n));
    } catch {
        return [];
    }
}

/** One hero in a ranking page or an explorer listing. */
export interface RankedHero {
    rank: number | null;
    /** data_type of the hero ('BSC' | 'POLYGON') - relevant when consolidated. */
    network: string;
    bomber_id: number;
    rarity: number;
    level: number;
    power: number;
    stamina: number;
    speed: number;
    bomb_count: number;
    bomb_range: number;
    abilities: number[];
    skin: number;
    color: number;
    stake_bcoin: number;
    stake_sen: number;
    wallet: string | null;
}

/** Aggregates shown above the hero ranking (for the current filter). */
export interface HeroStakeSummary {
    stake_bcoin: number;
    stake_sen: number;
    heroes: number;
    biggest_stake: number;
    avg_stake: number;
}

export interface HeroStakeRankingFilter {
    token: StakeTokenType;
    rarity: number | null;
    /** Network to query; defaults to the API instance's own network. */
    network?: string;
    /** true = sum both networks (BSC + Polygon) instead of the instance's. */
    consolidated: boolean;
    page: number;
    size: number;
}

export interface HeroStakeRankingResult {
    summary: HeroStakeSummary;
    total_count: number;
    items: RankedHero[];
}

/** One wallet in the top-stakers ranking. */
export interface RankedWallet {
    rank: number | null;
    wallet: string;
    heroes: number;
    heroes_staked: number;
    stake_bcoin: number;
    stake_sen: number;
}

export interface WalletStakeSummary {
    stake_bcoin: number;
    stake_sen: number;
    wallets: number;
    biggest_stake: number;
    avg_stake: number;
}

export interface WalletStakeRankingFilter {
    token: StakeTokenType;
    /** Network to query; defaults to the API instance's own network. */
    network?: string;
    /** true = sum both networks (BSC + Polygon) instead of the instance's. */
    consolidated: boolean;
    page: number;
    size: number;
}

export interface WalletStakeRankingResult {
    summary: WalletStakeSummary;
    total_count: number;
    items: RankedWallet[];
}

export interface WalletHouse {
    house_id: number;
    rarity: number;
    recovery: number;
    max_bomber: number;
    active: number;
}

export interface WalletProfile {
    wallet: string;
    heroes: number;
    heroes_staked: number;
    stake_bcoin: number;
    stake_sen: number;
    /** Position among staking wallets; null when this wallet has no stake. */
    rank_bcoin: number | null;
    rank_sen: number | null;
    houses: WalletHouse[];
}

export interface WalletHeroesFilter {
    stakedOnly: boolean;
    /** Network to query; defaults to the API instance's own network. */
    network?: string;
    page: number;
    size: number;
}

export interface WalletHeroesResult {
    total_count: number;
    items: RankedHero[];
}

export interface HeroDetail extends Omit<RankedHero, 'rank'> {
    /** Hero no longer in the owner's inventory (sold/transferred/burned). */
    has_delete: boolean;
    /** There is a create-rock burn record containing this hero. */
    burned: boolean;
    shield_level: number;
    /**
     * Positions among staked heroes; null when this hero has no stake.
     * rank_* / rank_*_rarity are within the hero's network; rank_*_global is
     * the consolidated position across all networks.
     */
    rank_bcoin: number | null;
    rank_bcoin_rarity: number | null;
    rank_bcoin_global: number | null;
    rank_bcoin_global_rarity: number | null;
    rank_sen: number | null;
    rank_sen_rarity: number | null;
    rank_sen_global: number | null;
    rank_sen_global_rarity: number | null;
}

export interface HouseDetail {
    house_id: number;
    rarity: number;
    recovery: number;
    max_bomber: number;
    active: number;
    wallet: string | null;
}
