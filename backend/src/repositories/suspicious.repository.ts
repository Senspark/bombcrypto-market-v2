import {DatabasePool} from '@/infrastructure/database/postgres';
import {ISuspiciousRepository} from '@/domain/interfaces/repository';
import {SuspiciousHeroRepr, SuspiciousWalletRepr} from '@/domain/models/suspicious';
import {Logger} from '@/utils/logger';

// Database rows
interface SuspiciousHeroRow {
    token_id: string;
    reason: string;
    note: string | null;
    created_at: Date;
    updated_at: Date;
}

interface SuspiciousWalletRow {
    wallet_address: string;
    reason: string;
    note: string | null;
    created_at: Date;
    updated_at: Date;
}

function rowToHero(row: SuspiciousHeroRow): SuspiciousHeroRepr {
    return {
        tokenId: parseInt(row.token_id, 10),
        reason: row.reason,
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function rowToWallet(row: SuspiciousWalletRow): SuspiciousWalletRepr {
    return {
        walletAddress: row.wallet_address,
        reason: row.reason,
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export class SuspiciousRepository implements ISuspiciousRepository {
    constructor(
        private db: DatabasePool,
        private logger: Logger
    ) {
    }

    async listHeroes(): Promise<SuspiciousHeroRepr[]> {
        const sql = `
      SELECT token_id, reason, note, created_at, updated_at
      FROM suspicious_heroes
      ORDER BY updated_at DESC
    `;
        const result = await this.db.query<SuspiciousHeroRow>(sql);
        return result.rows.map(rowToHero);
    }

    async listWallets(): Promise<SuspiciousWalletRepr[]> {
        const sql = `
      SELECT wallet_address, reason, note, created_at, updated_at
      FROM suspicious_wallets
      ORDER BY updated_at DESC
    `;
        const result = await this.db.query<SuspiciousWalletRow>(sql);
        return result.rows.map(rowToWallet);
    }

    async addHeroes(tokenIds: number[], reason: string, note: string | null): Promise<number> {
        if (tokenIds.length === 0) return 0;

        const sql = `
      INSERT INTO suspicious_heroes (token_id, reason, note)
      SELECT unnest($1::bigint[]), $2, $3
      ON CONFLICT (token_id) DO UPDATE SET
        reason = EXCLUDED.reason,
        note = EXCLUDED.note,
        updated_at = NOW()
    `;
        const result = await this.db.query(sql, [tokenIds, reason, note]);
        this.logger.info(`Marked ${result.rowCount} hero(es) as suspicious`);
        return result.rowCount ?? 0;
    }

    async removeHeroes(tokenIds: number[]): Promise<number> {
        if (tokenIds.length === 0) return 0;

        const sql = `DELETE FROM suspicious_heroes WHERE token_id = ANY($1::bigint[])`;
        const result = await this.db.query(sql, [tokenIds]);
        this.logger.info(`Unmarked ${result.rowCount} hero(es)`);
        return result.rowCount ?? 0;
    }

    async addWallets(addresses: string[], reason: string, note: string | null): Promise<number> {
        if (addresses.length === 0) return 0;

        const sql = `
      INSERT INTO suspicious_wallets (wallet_address, reason, note)
      SELECT unnest($1::text[]), $2, $3
      ON CONFLICT (wallet_address) DO UPDATE SET
        reason = EXCLUDED.reason,
        note = EXCLUDED.note,
        updated_at = NOW()
    `;
        const result = await this.db.query(sql, [addresses, reason, note]);
        this.logger.info(`Marked ${result.rowCount} wallet(s) as suspicious`);
        return result.rowCount ?? 0;
    }

    async removeWallets(addresses: string[]): Promise<number> {
        if (addresses.length === 0) return 0;

        const sql = `DELETE FROM suspicious_wallets WHERE wallet_address = ANY($1::text[]::public.citext[])`;
        const result = await this.db.query(sql, [addresses]);
        this.logger.info(`Unmarked ${result.rowCount} wallet(s)`);
        return result.rowCount ?? 0;
    }
}

// Factory function
export function createSuspiciousRepository(
    db: DatabasePool,
    logger: Logger
): ISuspiciousRepository {
    return new SuspiciousRepository(db, logger);
}
