/**
 * Centralized Redis key definitions for detect-transfer service.
 *
 * Network suffix: BSC → "BSC", POLYGON → "POL"
 */

const COOLDOWN_TTL_SECONDS = 900; // 15 minutes

function networkSuffix(network: string): string {
    return network === 'POLYGON' ? 'POL' : network;
}

export function searchIdsKey(type: 'HERO' | 'HOUSE', network: string): string {
    return `MKP_${type}_SEARCH_IDS_${networkSuffix(network)}`;
}

export function cooldownKeyPrefix(type: 'HERO' | 'HOUSE', network: string): string {
    return `MKP_${type}_COOLDOWN_${networkSuffix(network)}:`;
}

export function shieldDataKey(network: string): string {
    return `MKP_HERO_SS_DATA_${networkSuffix(network)}`;
}

export function shieldFetchKey(network: string): string {
    return `MKP_HERO_SS_FETCH_${networkSuffix(network)}`;
}

export {COOLDOWN_TTL_SECONDS};
