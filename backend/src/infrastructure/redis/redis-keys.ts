/**
 * Centralized Redis key definitions for backend service.
 *
 * Network suffix: polygon → "POL", bsc → "BSC"
 */

function networkSuffix(network: string): string {
    return network === 'polygon' ? 'POL' : network.toUpperCase();
}

export function heroSearchIdsKey(network: string): string {
    return `MKP_HERO_SEARCH_IDS_${networkSuffix(network)}`;
}

export function houseSearchIdsKey(network: string): string {
    return `MKP_HOUSE_SEARCH_IDS_${networkSuffix(network)}`;
}

// Must match detect-transfer's cooldownKeyPrefix: MKP_{TYPE}_COOLDOWN_{SUFFIX}:<id>
export function cooldownKey(type: 'HERO' | 'HOUSE', network: string, id: number | string): string {
    return `MKP_${type}_COOLDOWN_${networkSuffix(network)}:${id}`;
}

export function shieldDataKey(network: string): string {
    return `MKP_HERO_SS_DATA_${networkSuffix(network)}`;
}

export function shieldFetchKey(network: string): string {
    return `MKP_HERO_SS_FETCH_${networkSuffix(network)}`;
}
