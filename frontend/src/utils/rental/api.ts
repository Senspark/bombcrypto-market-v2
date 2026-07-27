/**
 * Client for the house rental API (mounted at /rental in the marketplace backend).
 *
 * Public endpoints need no session; the ones under /me and every write action
 * carry the player's JWT, and the backend resolves the game account from it.
 */

export interface RentalListing {
    listing_id: string;
    house_id: number;
    network: string;
    price_per_day: number | null;
    pay_token: string | null;
    status: string;
    created_at: string | null;
    rarity: number | null;
    recovery: number | null;
    capacity: number | null;
    gen_house_id: string | null;
    rental?: {
        rental_id: string;
        days_paid: number;
        total_days: number;
        current_period_end: string;
    } | null;
}

export interface RentalBalance {
    BCOIN: number;
    BCOIN_DEPOSITED: number;
    SEN: number;
    SEN_DEPOSITED: number;
}

export interface ActiveRental {
    rental_id: string;
    house_id: number;
    price_per_day: number;
    pay_token: string;
    total_days: number;
    days_paid: number;
    started_at: string;
    current_period_end: string;
    total_paid: number;
}

export interface RentalPayment {
    day_number: number;
    amount: number;
    fee: number;
    owner_amount: number;
    pay_token: string;
    charged_at: string;
}

export interface RentalConfig {
    fee: number;
    max_days: number;
    min_price: number;
    /** Share of the cancellation penalty that goes to the owner */
    cancel_fee_owner: number;
    /** Share of the cancellation penalty kept by the game */
    cancel_fee_game: number;
    is_open: boolean;
}

/** What giving up the rental now would cost. */
export interface CancellationPreview {
    remaining_days: number;
    remaining_value: number;
    penalty: number;
    penalty_owner: number;
    penalty_game: number;
}

export interface ListingSearchResult {
    listings: RentalListing[];
    total_count: number;
    total_pages: number;
    page: number;
    size: number;
    has_more: boolean;
}

export interface ListingFilters {
    network: string;
    rarities?: number[];
    payTokens?: string[];
    minPrice?: number;
    maxPrice?: number;
    orderBy?: string;
    page?: number;
    size?: number;
}

const RENTAL_BASE = import.meta.env.VITE_RENTAL_API ?? '/rental';

function buildUrl(path: string, params?: Record<string, unknown>): string {
    const url = new URL(`${RENTAL_BASE}${path}`, window.location.origin);
    Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
            value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
            url.searchParams.append(key, String(value));
        }
    });
    return url.toString().replace(window.location.origin, '');
}

async function request<T>(url: string, options: RequestInit = {}, token?: string): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) ?? {}),
    };
    if (token) {
        headers.authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {...options, headers});
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        const error = new Error(json?.message ?? 'request failed') as Error & { code?: number };
        error.code = json?.code;
        throw error;
    }
    return json as T;
}

export function getConfig(): Promise<RentalConfig> {
    return request<RentalConfig>(buildUrl('/config'));
}

export function searchListings(filters: ListingFilters): Promise<ListingSearchResult> {
    const price: string[] = [];
    if (filters.minPrice !== undefined) price.push(`gte:${filters.minPrice}`);
    if (filters.maxPrice !== undefined) price.push(`lte:${filters.maxPrice}`);

    return request<ListingSearchResult>(
        buildUrl('/listings', {
            network: filters.network,
            rarity: filters.rarities,
            pay_token: filters.payTokens,
            price,
            order_by: filters.orderBy,
            page: filters.page,
            size: filters.size,
        })
    );
}

export function createListing(
    token: string,
    payload: { house_id: number; network: string; price_per_day: number; pay_token: string }
): Promise<{ listing_id: string }> {
    return request(buildUrl('/listings'), {method: 'POST', body: JSON.stringify(payload)}, token);
}

export function updateListingPrice(token: string, listingId: string, pricePerDay: number): Promise<unknown> {
    return request(
        buildUrl(`/listings/${listingId}`),
        {method: 'PATCH', body: JSON.stringify({price_per_day: pricePerDay})},
        token
    );
}

export function deleteListing(token: string, listingId: string): Promise<unknown> {
    return request(buildUrl(`/listings/${listingId}`), {method: 'DELETE'}, token);
}

export function rentHouse(
    token: string,
    listingId: string,
    numDays: number
): Promise<{ rental_id: string; total_price: number; price_per_day: number; balance: RentalBalance }> {
    return request(
        buildUrl('/rent'),
        {method: 'POST', body: JSON.stringify({listing_id: Number(listingId), num_days: numDays})},
        token
    );
}

export function getMyListings(
    token: string,
    network: string
): Promise<{ listings: RentalListing[]; unlisted_houses: RentalListing[]; earnings: Record<string, number> }> {
    return request(buildUrl('/me/listings', {network}), {}, token);
}

export function getMyRental(
    token: string,
    network: string
): Promise<{
    rental: ActiveRental | null;
    payments?: RentalPayment[];
    balance?: RentalBalance;
    cancellation?: CancellationPreview;
}> {
    return request(buildUrl('/me/rental', {network}), {}, token);
}

/** Gives up the active rental; charges the penalty and returns the updated balance. */
export function cancelRental(
    token: string,
    network: string
): Promise<{ rental_id: string; penalty: number; pay_token: string; balance: RentalBalance }> {
    return request(buildUrl('/cancel'), {method: 'POST', body: JSON.stringify({network})}, token);
}

export function getMyBalance(token: string, network: string): Promise<{ balance: RentalBalance; wallet: string }> {
    return request(buildUrl('/me/balance', {network}), {}, token);
}
