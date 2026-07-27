import {Request, Response} from 'express';
import {Logger} from '@/utils/logger';
import {IRentalRepository} from '@/repositories/rental.repository';
import {IPlayerAuth, NoGameAccountError} from '@/infrastructure/auth/ap-login-auth';
import {IRentalService, parseRentalDbErrorCode} from '@/services/rental.service';
import {asyncHandler, HttpError, HttpErrors} from '../middleware/error-handler';
import {
    AuthenticatedPlayer,
    ListingStatus,
    NETWORK_BY_ALIAS,
    PayToken,
    RENTAL_SORT_COLUMNS,
    RentalErrorCode,
    RentalEvent,
    RentalListingRow,
} from '@/domain/models/rental';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface RentalHandlerDeps {
    rentalRepo: IRentalRepository;
    playerAuth: IPlayerAuth;
    rentalService: IRentalService;
    isRentalOpen: boolean;
    logger: Logger;
}

export function createRentalHandlers(deps: RentalHandlerDeps) {
    const {rentalRepo, playerAuth, rentalService} = deps;

    /** Resolves the caller from the Bearer token. Identity never comes from the body. */
    async function requirePlayer(req: Request): Promise<AuthenticatedPlayer> {
        let player: AuthenticatedPlayer | null;
        try {
            player = await playerAuth.authenticate(req.header('authorization'));
        } catch (err) {
            if (err instanceof NoGameAccountError) {
                throw new HttpError(
                    404,
                    'this wallet has no game account yet — log into the game once first',
                    RentalErrorCode.ACCOUNT_NOT_FOUND
                );
            }
            throw err;
        }

        if (!player) {
            throw new HttpError(401, 'unauthorized', RentalErrorCode.UNAUTHORIZED);
        }
        return player;
    }

    function assertOpen(): void {
        if (!deps.isRentalOpen) {
            throw new HttpError(503, 'house rental is closed', RentalErrorCode.RENTAL_CLOSED);
        }
    }

    /** The house must exist in the game AND still belong to the caller on-chain. */
    async function assertOwnsHouse(houseId: number, network: string,
                                   player: AuthenticatedPlayer): Promise<void> {
        const house = await rentalRepo.findHouse(houseId, network);
        if (!house) {
            // Not synced into the game yet: the owner must log in once first
            throw new HttpError(404, 'house not found for this account', RentalErrorCode.HOUSE_NOT_FOUND);
        }
        if (house.uid !== player.uid) {
            throw new HttpError(403, 'you are not the owner of this house', RentalErrorCode.NOT_HOUSE_OWNER);
        }

        const chainOwner = await rentalService.getHouseOwnerOnChain(houseId);
        if (chainOwner && chainOwner !== player.wallet.toLowerCase()) {
            throw new HttpError(409, 'house owner changed', RentalErrorCode.OWNER_CHANGED);
        }
    }

    async function assertOwnsListing(listingId: number,
                                     player: AuthenticatedPlayer): Promise<RentalListingRow> {
        const listing = await rentalRepo.findListingById(listingId);
        if (!listing || listing.status === ListingStatus.CANCELLED) {
            throw new HttpError(404, 'listing not found', RentalErrorCode.LISTING_NOT_FOUND);
        }
        if (listing.owner_uid !== player.uid) {
            throw new HttpError(403, 'you are not the owner of this house', RentalErrorCode.NOT_HOUSE_OWNER);
        }
        return listing;
    }

    /**
     * Closes the window where someone sells the house on-chain and leaves the
     * listing alive (the game's ownership sync is pull-based).
     */
    async function assertOwnerStillOnChain(listing: RentalListingRow): Promise<void> {
        const [ownerWallet, chainOwner] = await Promise.all([
            rentalRepo.findWalletByUid(listing.owner_uid),
            rentalService.getHouseOwnerOnChain(listing.house_id),
        ]);

        if (!chainOwner || !ownerWallet) {
            // Inconclusive: the stored procedure re-checks ownership under lock
            // and the charge job verifies again on every cycle.
            return;
        }
        if (chainOwner !== ownerWallet) {
            await rentalRepo.cancelListing(Number(listing.id));
            throw new HttpError(409, 'house owner changed', RentalErrorCode.OWNER_CHANGED);
        }
    }

    function toListingDto(row: RentalListingRow) {
        return {
            listing_id: row.id,
            house_id: row.house_id,
            network: row.type,
            price_per_day: row.price_per_day === null ? null : Number(row.price_per_day),
            pay_token: row.pay_token,
            status: row.status,
            created_at: row.created_at,
            rarity: row.rarity,
            recovery: row.recovery,
            capacity: row.max_bomber,
            gen_house_id: row.gen_house_id,
        };
    }

    return {
        // GET /rental/config
        config: asyncHandler(async (_req: Request, res: Response) => {
            const settings = await rentalService.getSettings();
            res.status(200).json({
                fee: settings.fee,
                max_days: settings.maxDays,
                min_price: settings.minPrice,
                cancel_fee_owner: settings.cancelFeeOwner,
                cancel_fee_game: settings.cancelFeeGame,
                is_open: deps.isRentalOpen,
            });
        }),

        // GET /rental/listings - public browsing
        search: asyncHandler(async (req: Request, res: Response) => {
            const network = parseNetwork(req.query.network);
            const page = Math.max(1, parseIntOr(req.query.page, 1));
            const size = Math.min(MAX_PAGE_SIZE, Math.max(1, parseIntOr(req.query.size, DEFAULT_PAGE_SIZE)));
            const {column, desc} = parseOrderBy(req.query.order_by);

            const result = await rentalRepo.browseListings({
                network,
                rarities: parseNumberArray(req.query.rarity),
                payTokens: parsePayTokens(req.query.pay_token),
                minPrice: parseRhsNumber(req.query.price, 'gte'),
                maxPrice: parseRhsNumber(req.query.price, 'lte'),
                sortColumn: column,
                sortDesc: desc,
                offset: (page - 1) * size,
                limit: size,
            });

            res.status(200).json({
                listings: result.rows.map(toListingDto),
                total_count: result.total,
                total_pages: Math.ceil(result.total / size),
                page,
                size,
                has_more: page * size < result.total,
            });
        }),

        // POST /rental/listings - owner lists a house
        createListing: asyncHandler(async (req: Request, res: Response) => {
            assertOpen();
            const player = await requirePlayer(req);
            const network = parseNetwork(req.body?.network);
            const houseId = parseRequiredInt(req.body?.house_id, 'house_id');
            const payToken = parsePayToken(req.body?.pay_token);
            const pricePerDay = Number(req.body?.price_per_day);

            const settings = await rentalService.getSettings();
            if (!Number.isFinite(pricePerDay) || pricePerDay < settings.minPrice) {
                throw new HttpError(400, `price must be at least ${settings.minPrice}`,
                    RentalErrorCode.INVALID_PRICE);
            }

            await assertOwnsHouse(houseId, network, player);

            const existing = await rentalRepo.findListingsByOwner(player.uid, network);
            if (existing.some((l) => l.house_id === houseId)) {
                throw new HttpError(400, 'house already listed', RentalErrorCode.ALREADY_LISTED);
            }

            const listingId = await rentalRepo.createListing(houseId, network, player.uid, pricePerDay, payToken);

            await rentalService.publishEvent({
                event: RentalEvent.LISTED,
                listing_id: listingId,
                house_id: houseId,
                type: network,
                owner_uid: player.uid,
            });

            res.status(201).json({
                listing_id: listingId,
                house_id: houseId,
                price_per_day: pricePerDay,
                pay_token: payToken,
            });
        }),

        // PATCH /rental/listings/:id - edit price (only while not rented)
        updateListing: asyncHandler(async (req: Request, res: Response) => {
            assertOpen();
            const player = await requirePlayer(req);
            const listingId = parseRequiredInt(req.params.id, 'listing id');
            const pricePerDay = Number(req.body?.price_per_day);

            const settings = await rentalService.getSettings();
            if (!Number.isFinite(pricePerDay) || pricePerDay < settings.minPrice) {
                throw new HttpError(400, `price must be at least ${settings.minPrice}`,
                    RentalErrorCode.INVALID_PRICE);
            }

            const listing = await assertOwnsListing(listingId, player);
            if (listing.status !== ListingStatus.AVAILABLE) {
                throw new HttpError(400, 'listing is rented and cannot be changed',
                    RentalErrorCode.LISTING_RENTED);
            }

            await rentalRepo.updateListingPrice(listingId, pricePerDay);
            res.status(200).json({listing_id: listing.id, price_per_day: pricePerDay});
        }),

        // DELETE /rental/listings/:id
        deleteListing: asyncHandler(async (req: Request, res: Response) => {
            const player = await requirePlayer(req);
            const listingId = parseRequiredInt(req.params.id, 'listing id');

            const listing = await assertOwnsListing(listingId, player);
            if (listing.status !== ListingStatus.AVAILABLE) {
                throw new HttpError(400, 'listing is rented and cannot be changed',
                    RentalErrorCode.LISTING_RENTED);
            }

            await rentalRepo.cancelListing(listingId);

            await rentalService.publishEvent({
                event: RentalEvent.UNLISTED,
                listing_id: listing.id,
                house_id: listing.house_id,
                type: listing.type,
                owner_uid: player.uid,
            });

            res.status(200).json({listing_id: listing.id});
        }),

        // POST /rental/rent - renter rents for N days (day 1 charged now)
        rent: asyncHandler(async (req: Request, res: Response) => {
            assertOpen();
            const player = await requirePlayer(req);
            const listingId = parseRequiredInt(req.body?.listing_id, 'listing_id');
            const numDays = parseRequiredInt(req.body?.num_days, 'num_days');

            const settings = await rentalService.getSettings();
            if (numDays < 1 || numDays > settings.maxDays) {
                throw new HttpError(400, `num_days must be between 1 and ${settings.maxDays}`,
                    RentalErrorCode.INVALID_DAYS);
            }

            const listing = await rentalRepo.findListingById(listingId);
            if (!listing) {
                throw new HttpError(404, 'listing not found', RentalErrorCode.LISTING_NOT_FOUND);
            }
            if (listing.status !== ListingStatus.AVAILABLE) {
                throw new HttpError(400, 'listing not available', RentalErrorCode.LISTING_NOT_AVAILABLE);
            }
            if (listing.owner_uid === player.uid) {
                throw new HttpError(400, 'cannot rent your own house', RentalErrorCode.OWN_HOUSE);
            }

            const active = await rentalRepo.findActiveRentalByRenter(player.uid, listing.type);
            if (active) {
                throw new HttpError(400, 'you already have an active rental', RentalErrorCode.ALREADY_RENTING);
            }

            await assertOwnerStillOnChain(listing);

            let rentalId: string;
            try {
                rentalId = await rentalRepo.rentHouse(listingId, player.uid, numDays, settings.fee, settings.maxDays);
            } catch (err) {
                throw translateDbError(err);
            }

            await rentalService.publishEvent({
                event: RentalEvent.RENTED,
                rental_id: rentalId,
                listing_id: listing.id,
                house_id: listing.house_id,
                type: listing.type,
                owner_uid: listing.owner_uid,
                renter_uid: player.uid,
                day_number: 1,
                amount: Number(listing.price_per_day),
                pay_token: listing.pay_token ?? undefined,
            });

            const balance = await rentalRepo.getUserBalance(player.uid, listing.type);
            const pricePerDay = Number(listing.price_per_day);

            res.status(201).json({
                rental_id: rentalId,
                house_id: listing.house_id,
                total_days: numDays,
                days_paid: 1,
                price_per_day: pricePerDay,
                total_price: pricePerDay * numDays,
                pay_token: listing.pay_token,
                balance,
            });
        }),

        // GET /rental/me/listings - owner dashboard with earnings
        myListings: asyncHandler(async (req: Request, res: Response) => {
            const player = await requirePlayer(req);
            const network = parseNetwork(req.query.network);

            const [listings, unlisted, earnings] = await Promise.all([
                rentalRepo.findListingsByOwner(player.uid, network),
                rentalRepo.findUnlistedHouses(player.uid, network),
                rentalRepo.getOwnerEarnings(player.uid, network),
            ]);

            // Attach contract progress (day X of Y) to the rented ones
            const rented = listings.filter((l) => l.status === ListingStatus.RENTED);
            const rentals = await Promise.all(
                rented.map((l) => rentalRepo.findActiveRentalByHouse(l.house_id, l.type))
            );
            const rentalByHouse = new Map<number, (typeof rentals)[number]>();
            rentals.forEach((r) => r && rentalByHouse.set(r.house_id, r));

            res.status(200).json({
                listings: listings.map((row) => {
                    const rental = rentalByHouse.get(row.house_id);
                    return {
                        ...toListingDto(row),
                        rental: rental
                            ? {
                                rental_id: rental.id,
                                days_paid: rental.days_paid,
                                total_days: rental.total_days,
                                current_period_end: rental.current_period_end,
                            }
                            : null,
                    };
                }),
                unlisted_houses: unlisted.map(toListingDto),
                earnings: earnings.reduce<Record<string, number>>((acc, e) => {
                    acc[e.pay_token] = Number(e.total);
                    return acc;
                }, {}),
            });
        }),

        // GET /rental/me/rental - renter's active contract
        myRental: asyncHandler(async (req: Request, res: Response) => {
            const player = await requirePlayer(req);
            const network = parseNetwork(req.query.network);

            const rental = await rentalRepo.findActiveRentalByRenter(player.uid, network);
            if (!rental) {
                res.status(200).json({rental: null});
                return;
            }

            const [payments, balance, settings] = await Promise.all([
                rentalRepo.getRentalPayments(rental.id),
                rentalRepo.getUserBalance(player.uid, network),
                rentalService.getSettings(),
            ]);

            // What giving up now would cost: penalty over the days not charged yet
            const remainingDays = Math.max(rental.total_days - rental.days_paid, 0);
            const remainingValue = remainingDays * Number(rental.price_per_day);
            const cancelPenaltyOwner = remainingValue * settings.cancelFeeOwner;
            const cancelPenaltyGame = remainingValue * settings.cancelFeeGame;

            res.status(200).json({
                cancellation: {
                    remaining_days: remainingDays,
                    remaining_value: remainingValue,
                    penalty: cancelPenaltyOwner + cancelPenaltyGame,
                    penalty_owner: cancelPenaltyOwner,
                    penalty_game: cancelPenaltyGame,
                },
                rental: {
                    rental_id: rental.id,
                    house_id: rental.house_id,
                    price_per_day: Number(rental.price_per_day),
                    pay_token: rental.pay_token,
                    total_days: rental.total_days,
                    days_paid: rental.days_paid,
                    started_at: rental.started_at,
                    current_period_end: rental.current_period_end,
                    total_paid: payments.reduce((sum, p) => sum + Number(p.amount), 0),
                },
                payments,
                balance,
            });
        }),

        // POST /rental/cancel - renter gives up before the contract ends
        cancel: asyncHandler(async (req: Request, res: Response) => {
            const player = await requirePlayer(req);
            const network = parseNetwork(req.body?.network);

            const rental = await rentalRepo.findActiveRentalByRenter(player.uid, network);
            if (!rental) {
                throw new HttpError(404, 'no active rental', RentalErrorCode.RENTAL_NOT_ACTIVE);
            }

            const settings = await rentalService.getSettings();

            let penalty: number;
            try {
                penalty = await rentalRepo.cancelRental(
                    rental.id,
                    player.uid,
                    settings.cancelFeeOwner,
                    settings.cancelFeeGame
                );
            } catch (err) {
                throw translateDbError(err);
            }

            await rentalService.publishEvent({
                event: RentalEvent.ENDED_BY_RENTER,
                rental_id: rental.id,
                listing_id: rental.listing_id,
                house_id: rental.house_id,
                type: rental.type,
                owner_uid: rental.owner_uid,
                renter_uid: player.uid,
                amount: penalty,
                pay_token: rental.pay_token,
            });

            const balance = await rentalRepo.getUserBalance(player.uid, network);

            res.status(200).json({
                rental_id: rental.id,
                house_id: rental.house_id,
                penalty,
                pay_token: rental.pay_token,
                balance,
            });
        }),

        // GET /rental/me/balance - in-game balance for the UI
        myBalance: asyncHandler(async (req: Request, res: Response) => {
            const player = await requirePlayer(req);
            const network = parseNetwork(req.query.network);
            const balance = await rentalRepo.getUserBalance(player.uid, network);
            res.status(200).json({balance, wallet: player.wallet});
        }),
    };
}

// ---------------------------------------------------------------------------
// Query/body parsing helpers
// ---------------------------------------------------------------------------

function toArray(value: unknown): unknown[] {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
}

function parseNetwork(raw: unknown): string {
    const alias = (typeof raw === 'string' ? raw : 'bsc').toLowerCase();
    const network = NETWORK_BY_ALIAS[alias];
    if (!network) {
        throw new HttpError(400, 'invalid network', RentalErrorCode.INVALID_NETWORK);
    }
    return network;
}

function parsePayToken(raw: unknown): string {
    const token = String(raw ?? '').toUpperCase();
    if (token !== PayToken.BCOIN && token !== PayToken.SEN) {
        throw new HttpError(400, 'invalid pay token', RentalErrorCode.INVALID_PAY_TOKEN);
    }
    return token;
}

function parsePayTokens(raw: unknown): string[] {
    return toArray(raw)
        .map((v) => String(v).toUpperCase())
        .filter((v) => v === PayToken.BCOIN || v === PayToken.SEN);
}

function parseNumberArray(raw: unknown): number[] {
    return toArray(raw)
        .map((v) => parseInt(String(v), 10))
        .filter((v) => Number.isInteger(v));
}

function parseIntOr(raw: unknown, fallback: number): number {
    const value = parseInt(String(raw), 10);
    return Number.isInteger(value) ? value : fallback;
}

function parseRequiredInt(raw: unknown, field: string): number {
    const value = parseInt(String(raw), 10);
    if (!Number.isInteger(value)) {
        throw new HttpError(400, `missing or invalid ${field}`, RentalErrorCode.MISSING_DATA);
    }
    return value;
}

/** RHS filter format used by the rest of the marketplace API: price=gte:10 */
function parseRhsNumber(raw: unknown, operator: string): number | undefined {
    for (const entry of toArray(raw)) {
        const [op, value] = String(entry).split(':');
        if (op === operator) {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }
    return undefined;
}

function parseOrderBy(raw: unknown): { column: string; desc: boolean } {
    const [direction, column] = String(raw ?? 'asc:price_per_day').split(':');
    return {
        // whitelist: this value is interpolated into ORDER BY
        column: RENTAL_SORT_COLUMNS[column] ?? RENTAL_SORT_COLUMNS.price_per_day,
        desc: direction?.toLowerCase() === 'desc',
    };
}

/** Maps stored-procedure errors ('<code>,<message>') to HTTP responses. */
function translateDbError(err: unknown): Error {
    const code = parseRentalDbErrorCode(err);
    switch (code) {
        case RentalErrorCode.NOT_ENOUGH_BALANCE:
            return new HttpError(400, 'not enough balance', code);
        case RentalErrorCode.LISTING_NOT_AVAILABLE:
            return new HttpError(400, 'listing not available', code);
        case RentalErrorCode.OWNER_CHANGED:
            return new HttpError(409, 'house owner changed', code);
        case RentalErrorCode.OWN_HOUSE:
            return new HttpError(400, 'cannot rent your own house', code);
        case RentalErrorCode.INVALID_DAYS:
            return new HttpError(400, 'invalid rental days', code);
        case RentalErrorCode.RENTAL_NOT_ACTIVE:
            return new HttpError(400, 'rental is not active', code);
        case RentalErrorCode.NOT_THE_RENTER:
            return new HttpError(403, 'you are not the renter of this rental', code);
        default:
            return err instanceof Error ? err : HttpErrors.internalError();
    }
}
