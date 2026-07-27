/**
 * House Rental (P2P) domain models.
 *
 * Renting is settled entirely in-game: the renter pays with the balance they
 * deposited into the game (BCOIN or SEN in `user_block_reward`) and the owner is
 * credited in the same transaction. Nothing touches the blockchain, so these
 * models live against the GAME database (bombcrypto2), not the marketplace one.
 */

export const ListingStatus = {
    AVAILABLE: 'AVAILABLE',
    RENTED: 'RENTED',
    CANCELLED: 'CANCELLED',
} as const;

export const RentalStatus = {
    ACTIVE: 'ACTIVE',
    ENDED_COMPLETED: 'ENDED_COMPLETED',
    ENDED_NO_FUNDS: 'ENDED_NO_FUNDS',
    ENDED_SOLD: 'ENDED_SOLD',
    ENDED_BY_RENTER: 'ENDED_BY_RENTER',
} as const;

export const PayToken = {
    BCOIN: 'BCOIN',
    SEN: 'SEN',
} as const;

/** Events published to the game server through the Redis stream. */
export const RentalEvent = {
    LISTED: 'LISTED',
    UNLISTED: 'UNLISTED',
    RENTED: 'RENTED',
    CHARGED: 'CHARGED',
    ENDED_COMPLETED: 'ENDED_COMPLETED',
    ENDED_NO_FUNDS: 'ENDED_NO_FUNDS',
    ENDED_SOLD: 'ENDED_SOLD',
    ENDED_BY_RENTER: 'ENDED_BY_RENTER',
} as const;

export const RENTAL_STREAM_KEY = 'AP_RENTAL_SYNC';

/** Maps the API network alias to the `type` column used by the game database. */
export const NETWORK_BY_ALIAS: Record<string, string> = {
    bsc: 'BSC',
    polygon: 'POLYGON',
    pol: 'POLYGON',
};

/** game_config keys holding the feature settings. */
export const RentalConfigKeys = {
    FEE: 'house_rental_fee',
    MAX_DAYS: 'house_rental_max_days',
    MIN_PRICE: 'house_rental_min_price',
    CANCEL_FEE_OWNER: 'house_rental_cancel_fee_owner',
    CANCEL_FEE_GAME: 'house_rental_cancel_fee_game',
};

export const RentalConfigDefaults = {
    FEE: 0.05,
    MAX_DAYS: 30,
    MIN_PRICE: 1,
    // Early cancellation: 15% of the amount still owed (10% owner + 5% game)
    CANCEL_FEE_OWNER: 0.10,
    CANCEL_FEE_GAME: 0.05,
};

/**
 * Business error codes. 1019 is raised by fn_sub_user_reward (insufficient
 * balance); 1021-1029 come from the stored procedures. Keep in sync with the
 * migration 20260726_120000_house_rental_p2p.sql in bombcrypto-server-v2.
 */
export const RentalErrorCode = {
    NOT_ENOUGH_BALANCE: 1019,
    INVALID_PAY_TOKEN: 1021,
    LISTING_NOT_AVAILABLE: 1022,
    OWNER_CHANGED: 1023,
    OWN_HOUSE: 1024,
    INVALID_DAYS: 1025,
    INVALID_FEE: 1026,
    RENTAL_NOT_ACTIVE: 1027,
    ALREADY_FULLY_PAID: 1028,
    PERIOD_NOT_DUE: 1029,

    UNAUTHORIZED: 1030,
    ACCOUNT_NOT_FOUND: 1031,
    HOUSE_NOT_FOUND: 1032,
    NOT_HOUSE_OWNER: 1033,
    ALREADY_LISTED: 1034,
    LISTING_NOT_FOUND: 1035,
    LISTING_RENTED: 1036,
    INVALID_PRICE: 1037,
    INVALID_NETWORK: 1038,
    ALREADY_RENTING: 1039,
    MISSING_DATA: 1041,
    RENTAL_CLOSED: 1042,
    NOT_THE_RENTER: 1043,
};

/** Sort whitelist: these values are interpolated into ORDER BY. */
export const RENTAL_SORT_COLUMNS: Record<string, string> = {
    price_per_day: 'l.price_per_day',
    rarity: 'h.rarity',
    created_at: 'l.created_at',
};

export interface RentalListingRow {
    id: string;
    house_id: number;
    type: string;
    owner_uid: number;
    price_per_day: number | null;
    pay_token: string | null;
    status: string;
    created_at: Date | null;
    // joined from user_house
    rarity: number | null;
    recovery: number | null;
    max_bomber: number | null;
    gen_house_id: string | null;
}

export interface RentalRow {
    id: string;
    listing_id: string;
    house_id: number;
    type: string;
    owner_uid: number;
    renter_uid: number;
    price_per_day: number;
    pay_token: string;
    total_days: number;
    days_paid: number;
    started_at: Date;
    current_period_end: Date;
    interrupted_by_sale: boolean;
    status: string;
    ended_at: Date | null;
}

export interface RentalPaymentRow {
    day_number: number;
    amount: number;
    fee: number;
    owner_amount: number;
    pay_token: string;
    charged_at: Date;
}

export interface RentalListingFilter {
    network: string;
    rarities: number[];
    payTokens: string[];
    minPrice?: number;
    maxPrice?: number;
    sortColumn: string;
    sortDesc: boolean;
    offset: number;
    limit: number;
}

export interface RentalSettings {
    fee: number;
    maxDays: number;
    minPrice: number;
    /** Share of the cancellation penalty that goes to the house owner */
    cancelFeeOwner: number;
    /** Share of the cancellation penalty kept by the game */
    cancelFeeGame: number;
}

export interface RentalEventPayload {
    event: string;
    rental_id?: string | number;
    listing_id?: string | number;
    house_id: number;
    /** network in the game database format (BSC / POLYGON) */
    type: string;
    owner_uid: number;
    renter_uid?: number;
    day_number?: number;
    amount?: number;
    pay_token?: string;
}

export interface RentalBalance {
    BCOIN: number;
    BCOIN_DEPOSITED: number;
    SEN: number;
    SEN_DEPOSITED: number;
}

export interface AuthenticatedPlayer {
    /** uid in the game (bomberland.users.id / public."user".id_user) */
    uid: number;
    wallet: string;
}
