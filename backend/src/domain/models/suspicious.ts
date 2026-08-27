// Manually curated lists used to warn buyers about heroes suspected of being
// obtained through fraud or a hacked account.

// What the entry was flagged for
export const SUSPICIOUS_REASON = {
    FRAUD: 'fraud',
    STOLEN: 'stolen',
    LAUNDERING: 'laundering',
} as const;

export type SuspiciousReason = typeof SUSPICIOUS_REASON[keyof typeof SUSPICIOUS_REASON];

export const DEFAULT_SUSPICIOUS_REASON: SuspiciousReason = SUSPICIOUS_REASON.FRAUD;

// Marked hero entry (from database)
export interface SuspiciousHeroRepr {
    tokenId: number;
    reason: string;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Marked wallet entry (from database)
export interface SuspiciousWalletRepr {
    walletAddress: string;
    reason: string;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Why a listing is flagged: either the hero itself or the wallet selling it
export type SuspiciousMatch = 'token' | 'seller';

// Flag attached to a hero listing in API responses
export interface SuspiciousFlag {
    reason: string;
    note: string | null;
    matchedBy: SuspiciousMatch;
}

// In-memory lookup tables, refreshed from the database periodically
export interface SuspiciousRegistry {
    heroes: Map<number, SuspiciousHeroRepr>;
    wallets: Map<string, SuspiciousWalletRepr>;
}

// Resolve the flag for a listing, hero match taking priority over seller match.
// token_id is a bigint, so the driver returns a string despite the number typing.
export function resolveSuspiciousFlag(
    registry: SuspiciousRegistry,
    tokenId: number | string,
    sellerWalletAddress: string
): SuspiciousFlag | null {
    const hero = registry.heroes.get(Number(tokenId));
    if (hero) {
        return {reason: hero.reason, note: hero.note, matchedBy: 'token'};
    }

    const wallet = registry.wallets.get((sellerWalletAddress || '').toLowerCase());
    if (wallet) {
        return {reason: wallet.reason, note: wallet.note, matchedBy: 'seller'};
    }

    return null;
}
