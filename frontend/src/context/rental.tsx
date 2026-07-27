import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {BrowserProvider} from 'ethers';
import {useAccount} from './account';
import {
    clearSession,
    isExpired,
    loadSession,
    refreshSession,
    RentalSession,
    signIn,
} from '../utils/rental/auth';

interface RentalAuthContextValue {
    session: RentalSession | null;
    signingIn: boolean;
    error: string | null;
    /** Connected wallet address, when available. */
    walletAddress: string;
    /** Prompts the wallet signature and opens a session. */
    login: () => Promise<void>;
    logout: () => void;
    /** Valid JWT, refreshing it first when close to expiry. */
    getToken: () => Promise<string | null>;
}

const RentalAuthContext = createContext<RentalAuthContextValue | undefined>(undefined);

export function RentalAuthProvider({children}: { children: ReactNode }): JSX.Element {
    const {auth, network} = useAccount();
    const [session, setSession] = useState<RentalSession | null>(() => loadSession());
    const [signingIn, setSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const walletAddress = (auth?.address ?? '').toLowerCase();

    // A different wallet means a different game account: drop the old session.
    useEffect(() => {
        if (session && walletAddress && session.wallet !== walletAddress) {
            clearSession();
            setSession(null);
        }
    }, [walletAddress, session]);

    const login = useCallback(async () => {
        if (!walletAddress) {
            setError('Connect your wallet first');
            return;
        }

        setSigningIn(true);
        setError(null);
        try {
            const provider = new BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const created = await signIn(walletAddress, network, (message) => signer.signMessage(message));
            setSession(created);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'sign-in failed';
            // A user closing the wallet popup is not an error worth shouting about
            setError(message.includes('rejected') ? 'Signature cancelled' : message);
        } finally {
            setSigningIn(false);
        }
    }, [walletAddress, network]);

    const logout = useCallback(() => {
        clearSession();
        setSession(null);
    }, []);

    const getToken = useCallback(async (): Promise<string | null> => {
        if (!session) {
            return null;
        }
        if (!isExpired(session)) {
            return session.token;
        }

        const renewed = await refreshSession(session, network);
        if (!renewed) {
            clearSession();
            setSession(null);
            return null;
        }
        setSession(renewed);
        return renewed.token;
    }, [session, network]);

    const value = useMemo(
        () => ({session, signingIn, error, walletAddress, login, logout, getToken}),
        [session, signingIn, error, walletAddress, login, logout, getToken]
    );

    return <RentalAuthContext.Provider value={value}>{children}</RentalAuthContext.Provider>;
}

export function useRentalAuth(): RentalAuthContextValue {
    const context = useContext(RentalAuthContext);
    if (!context) {
        throw new Error('useRentalAuth must be used within a RentalAuthProvider');
    }
    return context;
}
