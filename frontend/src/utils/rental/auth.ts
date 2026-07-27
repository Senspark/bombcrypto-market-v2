/**
 * Player sign-in for the house rental feature.
 *
 * There is no username/password: the player connects their wallet and signs a
 * one-time challenge with `personal_sign` (off-chain, no gas). ap-login checks
 * the signature and returns a JWT that identifies the game account.
 *
 * The challenge string is rebuilt locally exactly like the game's web client
 * does: `"Your login code: " + AES-CBC(SIGN_PADDING + nonce, iv)`, where the
 * nonce blob carries both the nonce number and the IV.
 */

const AUTH_STORAGE_KEY = 'rental_auth';

export interface RentalSession {
    token: string;
    refreshToken: string;
    wallet: string;
    /** epoch ms when the JWT expires (ap-login issues 30 min tokens) */
    expiresAt: number;
}

const TOKEN_TTL_MS = 25 * 60 * 1000; // renew before the 30 min expiry

/** ap-login base URL, e.g. http://localhost:8120/web */
function apLoginBase(): string {
    const host = import.meta.env.VITE_API_HOST ?? '';
    return host.replace(/\/+$/, '');
}

/** Network segment used by ap-login routes (bsc, pol, ...). */
function networkSegment(network: string): string {
    return network.toLowerCase() === 'polygon' ? 'pol' : 'bsc';
}

/** Returns a plain ArrayBuffer, which is what SubtleCrypto accepts. */
function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach((b) => {
        binary += String.fromCharCode(b);
    });
    return window.btoa(binary);
}

/**
 * Rebuilds the exact string ap-login expects the wallet to sign.
 * Mirrors WalletService.generateStringToSign in the game's web client.
 */
async function buildMessageToSign(nonceBlob: string): Promise<string> {
    const signSecret = import.meta.env.VITE_SIGN_SECRET;
    const signPadding = import.meta.env.VITE_SIGN_PADDING ?? '';
    if (!signSecret) {
        throw new Error('VITE_SIGN_SECRET is not configured');
    }

    const nonceBuffer = base64ToBuffer(nonceBlob);
    // first 4 bytes: nonce as a LITTLE-endian uint32; remaining 16 bytes: AES IV
    const nonce = new DataView(nonceBuffer).getUint32(0, true);
    const iv = nonceBuffer.slice(4);

    const key = await window.crypto.subtle.importKey(
        'raw',
        base64ToBuffer(signSecret),
        {name: 'AES-CBC'},
        false,
        ['encrypt']
    );

    const message = new TextEncoder().encode(`${signPadding}${nonce}`);
    const encrypted = await window.crypto.subtle.encrypt({name: 'AES-CBC', iv}, key, message);

    return `Your login code: ${bytesToBase64(new Uint8Array(encrypted))}`;
}

async function postJson<T>(url: string, body: unknown, token?: string): Promise<T> {
    const headers: Record<string, string> = {'Content-Type': 'application/json'};
    if (token) {
        headers.authorization = `Bearer ${token}`;
    }
    const res = await fetch(url, {method: 'POST', headers, body: JSON.stringify(body)});
    const json = await res.json();
    if (!res.ok || json?.success === false) {
        throw new Error(json?.error?.message ?? json?.error ?? 'request failed');
    }
    return json.message as T;
}

/**
 * Runs the full sign-in: asks for a nonce, has the wallet sign it and exchanges
 * the signature for a session. `signMessage` comes from the connected wallet.
 */
export async function signIn(
    walletAddress: string,
    network: string,
    signMessage: (message: string) => Promise<string>
): Promise<RentalSession> {
    const base = `${apLoginBase()}/${networkSegment(network)}`;
    const address = walletAddress.toLowerCase();

    const {nonce} = await postJson<{ nonce: string }>(`${base}/nonce`, {walletAddress: address});
    const message = await buildMessageToSign(nonce);
    const signature = await signMessage(message);

    const proof = await postJson<{ auth: string; rf: string }>(`${base}/check_proof`, {
        walletAddress: address,
        signature,
    });

    const session: RentalSession = {
        token: proof.auth,
        refreshToken: proof.rf,
        wallet: address,
        expiresAt: Date.now() + TOKEN_TTL_MS,
    };
    saveSession(session);
    return session;
}

/** Renews the JWT with the long-lived refresh token (valid for 30 days). */
export async function refreshSession(session: RentalSession, network: string): Promise<RentalSession | null> {
    try {
        const base = `${apLoginBase()}/${networkSegment(network)}`;
        const res = await fetch(`${base}/refresh/${session.refreshToken}`);
        const json = await res.json();
        const auth = json?.message?.auth;
        if (!res.ok || !auth) {
            return null;
        }
        const renewed: RentalSession = {...session, token: auth, expiresAt: Date.now() + TOKEN_TTL_MS};
        saveSession(renewed);
        return renewed;
    } catch {
        return null;
    }
}

export function saveSession(session: RentalSession): void {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): RentalSession | null {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw) as RentalSession;
    } catch {
        return null;
    }
}

export function clearSession(): void {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isExpired(session: RentalSession): boolean {
    return Date.now() >= session.expiresAt;
}
