import {JsonRpcProvider} from 'ethers';

const TAG = '[RPC]';
const rpcHost = import.meta.env.VITE_RPC_HOST ?? '/api/rpc';
const isProduction = import.meta.env.VITE_IS_PROD === 'true';

const CHAIN_ID_BSC_MAINNET = 56;
const CHAIN_ID_BSC_TESTNET = 97;
const CHAIN_ID_POLYGON_MAINNET = 137;
const CHAIN_ID_POLYGON_TESTNET = 80002;

// localStorage keys for the fetched/cached RPC lists
const STORAGE_KEY_BSC = 'rpc_list_bsc';
const STORAGE_KEY_POLYGON = 'rpc_list_polygon';

// Hardcoded fallback RPC lists (never persisted to localStorage)
const HARDCODE_BSC_MAINNET: string[] = [
    'https://bsc-dataseed.binance.org/',
    'https://bsc-dataseed1.binance.org/',
    'https://bsc-dataseed2.binance.org/',
    'https://bsc-dataseed3.binance.org/',
    'https://bsc-dataseed4.binance.org/',
];

const HARDCODE_BSC_TESTNET: string[] = [
    'https://bsc-testnet-dataseed.bnbchain.org',
    'https://bsc-testnet.bnbchain.org',
    'https://bsc-prebsc-dataseed.bnbchain.org',
];

const HARDCODE_POLYGON_MAINNET: string[] = [
    'https://polygon.api.onfinality.io/public',
    // 'https://polygon.rpc.subquery.network/public',
    'https://poly.api.pocket.network/',
    'https://rpc-mainnet.matic.quiknode.pro',
    'https://polygon.drpc.org/'
];

const HARDCODE_POLYGON_TESTNET: string[] = [
    'https://polygon-amoy.drpc.org',
];


export class RpcService {
    private _bscRpcs: string[] = [];
    private _polygonRpcs: string[] = [];

    /**
     * Fetches RPC lists from the API, falls back to localStorage then hardcoded lists.
     * Tests all RPCs concurrently and keeps only working ones per network.
     * Must be awaited before calling getRpc().
     */
    async initialize(): Promise<void> {
        console.log(`${TAG} Initializing...`);

        const [bscRpcs, polygonRpcs] = await Promise.all([
            this.loadRpcList('bsc'),
            this.loadRpcList('polygon'),
        ]);

        const bscChainId = isProduction ? CHAIN_ID_BSC_MAINNET : CHAIN_ID_BSC_TESTNET;
        const polygonChainId = isProduction ? CHAIN_ID_POLYGON_MAINNET : CHAIN_ID_POLYGON_TESTNET;

        const [bscWorking, polygonWorking] = await Promise.all([
            this.filterWorkingRpcs(bscRpcs, bscChainId),
            this.filterWorkingRpcs(polygonRpcs, polygonChainId),
        ]);

        this._bscRpcs = bscWorking;
        this._polygonRpcs = polygonWorking;

        // console.log(`${TAG} BSC working RPCs (${this._bscRpcs.length}): ${this._bscRpcs.join(', ')}`);
        // console.log(`${TAG} Polygon working RPCs (${this._polygonRpcs.length}): ${this._polygonRpcs.join(', ')}`);
        console.log(`${TAG} Initialized`);
    }

    /**
     * Returns a random verified working RPC URL for the given chainId.
     * Falls back to the first hardcoded entry if initialization failed.
     * Now not support for testest
     */
    getRpc(chainId: number): string {
        switch (chainId) {
            case 56:   // BSC mainnet
                return this._pickRandom(this._bscRpcs, HARDCODE_BSC_MAINNET);
            case 97:   // BSC testnet
                return this._pickRandom(this._bscRpcs, HARDCODE_BSC_TESTNET);
            case 137:  // Polygon mainnet
                return this._pickRandom(this._polygonRpcs, HARDCODE_POLYGON_MAINNET);
            case 80002: // Polygon testnet (Amoy)
                return this._pickRandom(this._polygonRpcs, HARDCODE_POLYGON_TESTNET);
            default:
                console.error(`${TAG} Unknown chainId: ${chainId}`);
                return '';
        }
    }

    /**
     * Returns a random element from the working list.
     * If the working list is empty, falls back to the first entry of the fallback list.
     */
    private _pickRandom(workingList: string[], fallback: string[]): string {
        if (workingList.length > 0) {
            return workingList[Math.floor(Math.random() * workingList.length)];
        }
        // console.error(`${TAG} Working RPC list is empty, using random hardcoded fallback`);
        return fallback[Math.floor(Math.random() * fallback.length)] ?? '';
    }


    /**
     * For Testing each rpc
     * @param workingList
     * @param fallback
     * @param index
     * @private
     */
    // private _pickAt(workingList: string[], fallback: string[], index: number): string {
    //     if (workingList.length > 0) {
    //         if(index <= workingList.length) {
    //             return workingList[index];
    //         }
    //         return workingList[0];
    //     }
    //     console.error(`${TAG} Working RPC list is empty, using random hardcoded fallback`);
    //     return fallback[Math.floor(Math.random() * fallback.length)] ?? '';
    // }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    /**
     * Tries to load the RPC list for a network in this order:
     *  1. Fetch from remote API and save to localStorage
     *  2. Read from localStorage
     *  3. Use hardcoded fallback (NOT saved to localStorage)
     */
    private async loadRpcList(network: 'bsc' | 'polygon'): Promise<string[]> {
        if (!isProduction) {
            const testnetFallback = network === 'bsc' ? HARDCODE_BSC_TESTNET : HARDCODE_POLYGON_TESTNET;
            console.log(`${TAG} Testnet mode — using hardcoded ${network} testnet list (${testnetFallback.length} entries)`);
            return testnetFallback;
        }

        const storageKey = network === 'bsc' ? STORAGE_KEY_BSC : STORAGE_KEY_POLYGON;
        const endpoint = `${rpcHost}/${network}`;

        // 1. Try remote API
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json() as string[];
                if (Array.isArray(data) && data.length > 0) {
                    localStorage.removeItem(storageKey);
                    localStorage.setItem(storageKey, JSON.stringify(data));
                    return data;
                }
            }
        } catch (e) {
            console.error(`${TAG} Failed to fetch ${network} RPC list from API: ${e}`);
        }

        // 2. Try localStorage
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const data = JSON.parse(stored) as string[];
                if (Array.isArray(data) && data.length > 0) {
                    return data;
                }
            }
        } catch (e) {
            console.error(`${TAG} Failed to read ${network} RPC list from localStorage: ${e}`);
        }

        // 3. Hardcoded mainnet fallback — intentionally NOT saved to localStorage
        return network === 'bsc' ? HARDCODE_BSC_MAINNET : HARDCODE_POLYGON_MAINNET;
    }

    /**
     * Tests all RPCs in the list concurrently and returns only the ones that
     * respond successfully AND report the expected chainId. This rejects RPCs
     * that are alive but point at the wrong network (e.g. a testnet RPC leaking
     * into the mainnet pool), which would make mainnet contract calls return 0x.
     * If none work, returns an empty array (caller handles the fallback).
     */
    private async filterWorkingRpcs(rpcs: string[], expectedChainId: number): Promise<string[]> {
        const unique = [...new Set(rpcs)];

        const results = await Promise.allSettled(
            unique.map(async (rpc) => {
                const provider = new JsonRpcProvider(rpc);
                const network = await provider.getNetwork();
                if (Number(network.chainId) !== expectedChainId) {
                    throw new Error(`chainId mismatch: expected ${expectedChainId}, got ${network.chainId}`);
                }
                return rpc;
            })
        );

        const working: string[] = [];
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'fulfilled') {
                // console.log(`${TAG} Verified working RPC: ${unique[i]}`);
                working.push(result.value);
            } else {
                // console.error(`${TAG} RPC not working [${unique[i]}]: ${result.reason}`);
            }
        }

        return working;
    }
}

// Shared singleton instance used across the app.
export const rpcService = new RpcService();

