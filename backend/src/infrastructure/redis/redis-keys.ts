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

export function shieldDataKey(network: string): string {
    return `MKP_HERO_SS_DATA_${networkSuffix(network)}`;
}

export function shieldFetchKey(network: string): string {
    return `MKP_HERO_SS_FETCH_${networkSuffix(network)}`;
}
