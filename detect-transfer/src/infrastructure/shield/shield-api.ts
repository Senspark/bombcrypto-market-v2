import type {Logger} from '@/utils/logger';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // ms

export class RateLimitError extends Error {
    constructor(retryAfterMs: number) {
        super(`Rate limited, retry after ${retryAfterMs}ms`);
        this.name = 'RateLimitError';
        this.retryAfterMs = retryAfterMs;
    }
    readonly retryAfterMs: number;
}

interface ShieldHeroData {
    shieldAmount: string;
    shieldLevel: number;
    heroType: string;
    rarity: string;
    currentStake: number;
    mustStake: number;
    currentStakeBcoin: number;
    currentStakeSen: number;
}

interface BatchShieldApiResponse {
    success: boolean;
    message?: Record<string, ShieldHeroData | null>;
}

function toCompactShieldData(data: ShieldHeroData): string {
    return [
        data.shieldAmount,
        data.shieldLevel,
        data.heroType,
        data.rarity,
        data.currentStake,
        data.mustStake,
        data.currentStakeBcoin,
        data.currentStakeSen,
    ].join(',');
}

export class ShieldApi {
    private readonly baseUrl: string;
    private readonly logger: Logger;

    constructor(baseUrl: string, logger: Logger) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.logger = logger;
    }

    async fetchBatchShieldData(heroIds: number[], network: string): Promise<Map<string, string | null>> {
        const url = `${this.baseUrl}/shield/heroes`;
        const result = new Map<string, string | null>();

        const body = JSON.stringify({heroIds, network});

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body,
                });

                if (response.status === 429) {
                    const retryAfter = response.headers.get('retry-after');
                    const retryMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10_000;
                    throw new RateLimitError(retryMs);
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = (await response.json()) as BatchShieldApiResponse;

                if (!data.success || !data.message) {
                    this.logger.warn('ShieldApi batch returned no data', {
                        success: data.success,
                        hasMessage: !!data.message,
                        heroCount: heroIds.length,
                    });
                    return result;
                }

                for (const [tokenId, heroData] of Object.entries(data.message)) {
                    result.set(tokenId, heroData ? toCompactShieldData(heroData) : null);
                }

                return result;
            } catch (err) {
                if (err instanceof RateLimitError) throw err;

                this.logger.warn(`ShieldApi batch request failed (attempt ${attempt + 1}/${MAX_RETRIES})`, {
                    heroCount: heroIds.length,
                    error: err instanceof Error ? err.message : String(err),
                });

                if (attempt < MAX_RETRIES - 1) {
                    await this.sleep(RETRY_DELAY);
                }
            }
        }

        return result;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
