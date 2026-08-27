import {ISuspiciousRepository} from '@/domain/interfaces/repository';
import {SuspiciousRegistry} from '@/domain/models/suspicious';
import {Logger} from '@/utils/logger';

// Registry interface
export interface ISuspiciousRegistry {
    // Get the current lookup tables, reloading from the database when stale
    get(): Promise<SuspiciousRegistry>;

    // Drop the cached tables so the next read reloads them
    invalidate(): void;
}

const EMPTY_REGISTRY: SuspiciousRegistry = {heroes: new Map(), wallets: new Map()};

/**
 * Keeps the lists in memory so the hero search need not join against them on
 * every request. Reloads on a TTL, or immediately after an admin write.
 */
export class MemorySuspiciousRegistry implements ISuspiciousRegistry {
    private registry: SuspiciousRegistry = EMPTY_REGISTRY;
    private expiresAt = 0;
    private loading: Promise<SuspiciousRegistry> | null = null;

    constructor(
        private readonly repo: ISuspiciousRepository,
        private readonly ttlMs: number,
        private readonly logger: Logger
    ) {
    }

    async get(): Promise<SuspiciousRegistry> {
        if (Date.now() < this.expiresAt) {
            return this.registry;
        }

        // Prevent a thundering herd of reloads
        if (this.loading) {
            return this.loading;
        }

        this.loading = this.load().finally(() => {
            this.loading = null;
        });

        return this.loading;
    }

    invalidate(): void {
        this.expiresAt = 0;
    }

    private async load(): Promise<SuspiciousRegistry> {
        try {
            const [heroes, wallets] = await Promise.all([
                this.repo.listHeroes(),
                this.repo.listWallets(),
            ]);

            this.registry = {
                heroes: new Map(heroes.map((h) => [h.tokenId, h])),
                wallets: new Map(wallets.map((w) => [w.walletAddress.toLowerCase(), w])),
            };
            this.expiresAt = Date.now() + this.ttlMs;

            this.logger.debug(
                `Suspicious registry loaded: ${heroes.length} hero(es), ${wallets.length} wallet(s)`
            );
        } catch (err) {
            // Keep serving the previous snapshot rather than breaking the search
            this.logger.warn('Failed to reload suspicious registry:', err);
        }

        return this.registry;
    }
}

// Factory function
export function createSuspiciousRegistry(
    repo: ISuspiciousRepository,
    ttlSeconds: number,
    logger: Logger
): ISuspiciousRegistry {
    return new MemorySuspiciousRegistry(repo, ttlSeconds * 1000, logger);
}
