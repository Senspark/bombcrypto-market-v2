import {BlockChainCenterApi} from '@/infrastructure/blockchain/blockchain-center-api';
import {IRedisClient} from '@/infrastructure/redis/client';
import {Logger} from '@/utils/logger';
import {IRentalRepository} from '@/repositories/rental.repository';
import {
    RENTAL_STREAM_KEY,
    RentalConfigDefaults,
    RentalConfigKeys,
    RentalEventPayload,
    RentalSettings,
} from '@/domain/models/rental';

const CONFIG_CACHE_TTL_MS = 60_000;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const OWNER_OF_ABI = [
    {
        inputs: [{internalType: 'uint256', name: 'tokenId', type: 'uint256'}],
        name: 'ownerOf',
        outputs: [{internalType: 'address', name: 'owner', type: 'address'}],
        stateMutability: 'view',
        type: 'function',
    },
];

export interface IRentalService {
    /** Feature settings from game_config (fee, limits), cached for a minute. */
    getSettings(): Promise<RentalSettings>;

    /**
     * On-chain owner of the house NFT, lowercased. Returns null when it cannot
     * be determined, so callers can decide whether to block or carry on.
     */
    getHouseOwnerOnChain(houseId: number): Promise<string | null>;

    /** Notifies the game server so online players see the change immediately. */
    publishEvent(payload: RentalEventPayload): Promise<void>;
}

export function createRentalService(
    repository: IRentalRepository,
    blockchainApi: BlockChainCenterApi | null,
    houseContractAddress: string,
    redis: IRedisClient | null,
    logger: Logger
): IRentalService {
    let cachedSettings: RentalSettings | null = null;
    let cachedAt = 0;

    return {
        async getSettings(): Promise<RentalSettings> {
            if (cachedSettings && Date.now() - cachedAt < CONFIG_CACHE_TTL_MS) {
                return cachedSettings;
            }

            const settings: RentalSettings = {
                fee: RentalConfigDefaults.FEE,
                maxDays: RentalConfigDefaults.MAX_DAYS,
                minPrice: RentalConfigDefaults.MIN_PRICE,
                cancelFeeOwner: RentalConfigDefaults.CANCEL_FEE_OWNER,
                cancelFeeGame: RentalConfigDefaults.CANCEL_FEE_GAME,
            };

            try {
                const values = await repository.getGameConfig([
                    RentalConfigKeys.FEE,
                    RentalConfigKeys.MAX_DAYS,
                    RentalConfigKeys.MIN_PRICE,
                    RentalConfigKeys.CANCEL_FEE_OWNER,
                    RentalConfigKeys.CANCEL_FEE_GAME,
                ]);
                settings.fee = parseNumber(values.get(RentalConfigKeys.FEE), RentalConfigDefaults.FEE);
                settings.maxDays = parseNumber(values.get(RentalConfigKeys.MAX_DAYS), RentalConfigDefaults.MAX_DAYS);
                settings.minPrice = parseNumber(values.get(RentalConfigKeys.MIN_PRICE), RentalConfigDefaults.MIN_PRICE);
                settings.cancelFeeOwner = parseNumber(
                    values.get(RentalConfigKeys.CANCEL_FEE_OWNER), RentalConfigDefaults.CANCEL_FEE_OWNER);
                settings.cancelFeeGame = parseNumber(
                    values.get(RentalConfigKeys.CANCEL_FEE_GAME), RentalConfigDefaults.CANCEL_FEE_GAME);

                if (settings.fee < 0 || settings.fee >= 1) {
                    logger.error(`Invalid house_rental_fee ${settings.fee}, using default`);
                    settings.fee = RentalConfigDefaults.FEE;
                }

                const cancelTotal = settings.cancelFeeOwner + settings.cancelFeeGame;
                if (settings.cancelFeeOwner < 0 || settings.cancelFeeGame < 0 || cancelTotal >= 1) {
                    logger.error(`Invalid house rental cancel fees (${cancelTotal}), using defaults`);
                    settings.cancelFeeOwner = RentalConfigDefaults.CANCEL_FEE_OWNER;
                    settings.cancelFeeGame = RentalConfigDefaults.CANCEL_FEE_GAME;
                }
            } catch (err) {
                logger.error('Failed to load rental config, using defaults:', err);
            }

            cachedSettings = settings;
            cachedAt = Date.now();
            return settings;
        },

        async getHouseOwnerOnChain(houseId: number): Promise<string | null> {
            if (!blockchainApi || !houseContractAddress) {
                return null;
            }
            try {
                const owner = await blockchainApi.callContract<string>(
                    houseContractAddress,
                    OWNER_OF_ABI,
                    'ownerOf',
                    [houseId.toString()]
                );
                if (!owner || owner === ZERO_ADDRESS) {
                    return null;
                }
                return owner.toLowerCase();
            } catch (err) {
                logger.error(`Failed to read on-chain owner of house ${houseId}:`, err);
                return null;
            }
        },

        async publishEvent(payload: RentalEventPayload): Promise<void> {
            if (!redis) {
                return;
            }
            try {
                // Same shape as the AP_BL_SYNC_* streams the game already consumes
                await redis.xadd(RENTAL_STREAM_KEY, 'data', JSON.stringify(payload));
            } catch (err) {
                // Notification is best-effort: the database is the source of
                // truth and the game reloads state on the next login.
                logger.error(`Failed to publish rental event ${payload.event}:`, err);
            }
        },
    };
}

function parseNumber(raw: string | undefined, fallback: number): number {
    if (raw === undefined) {
        return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
}

/** Extracts the numeric code from procedure errors formatted as '<code>,<message>'. */
export function parseRentalDbErrorCode(error: unknown): number | null {
    const message = error instanceof Error ? error.message : String(error ?? '');
    const match = message.match(/(?:^|\s)(\d{4}),/);
    return match ? parseInt(match[1], 10) : null;
}
