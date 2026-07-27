import {Logger} from '@/utils/logger';
import {AuthenticatedPlayer} from '@/domain/models/rental';
import {IRentalRepository} from '@/repositories/rental.repository';

interface VerifyEnvelope {
    success?: boolean;
    message?: { valid?: boolean; wallet?: string };
}

const VERIFY_PATH = '/web/verify_login';
const UID_CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 5_000;

export interface IPlayerAuth {
    /**
     * Resolves the player behind an `Authorization: Bearer <jwt>` header.
     * Returns null when the token is missing or invalid.
     * Throws NoGameAccountError when the signature is valid but the wallet has
     * no account in the game yet — worth telling the user apart from a bad token.
     */
    authenticate(authHeader: string | undefined): Promise<AuthenticatedPlayer | null>;
}

/** Valid wallet signature, but this wallet never played the game. */
export class NoGameAccountError extends Error {
    constructor(public readonly wallet: string) {
        super('no game account for this wallet');
    }
}

/**
 * Player authentication for the marketplace site.
 *
 * The site has the user connect their wallet and sign the ap-login challenge
 * (personal_sign, off-chain, no gas), receiving a JWT. We do not verify that JWT
 * ourselves: it is forwarded to ap-login's /web/verify_login, which returns the
 * wallet it was issued for - the same pattern the share-on-x service uses. The
 * wallet is then mapped to the game uid, which is the ONLY source of identity:
 * request bodies never carry a uid.
 */
export function createPlayerAuth(
    apLoginUrl: string,
    repository: IRentalRepository,
    logger: Logger
): IPlayerAuth {
    const verifyUrl = `${apLoginUrl.replace(/\/+$/, '')}${VERIFY_PATH}`;
    const uidCache = new Map<string, { uid: number; at: number }>();

    async function verifyToken(authHeader: string): Promise<string | null> {
        try {
            const res = await fetch(verifyUrl, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    authorization: authHeader,
                },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
            if (!res.ok) {
                return null;
            }
            const body = (await res.json()) as VerifyEnvelope;
            const wallet = body?.message?.wallet;
            if (!body?.success || !body?.message?.valid || !wallet) {
                return null;
            }
            return wallet.toLowerCase();
        } catch (err) {
            logger.error('ap-login verify failed:', err);
            return null;
        }
    }

    async function resolveUid(wallet: string): Promise<number | null> {
        const cached = uidCache.get(wallet);
        if (cached && Date.now() - cached.at < UID_CACHE_TTL_MS) {
            return cached.uid;
        }

        const uid = await repository.findUidByWallet(wallet);
        if (uid !== null) {
            uidCache.set(wallet, {uid, at: Date.now()});
        }
        return uid;
    }

    return {
        async authenticate(authHeader: string | undefined): Promise<AuthenticatedPlayer | null> {
            if (!authHeader) {
                return null;
            }

            const wallet = await verifyToken(authHeader);
            if (!wallet) {
                return null;
            }

            const uid = await resolveUid(wallet);
            if (uid === null) {
                throw new NoGameAccountError(wallet);
            }

            return {uid, wallet};
        },
    };
}
