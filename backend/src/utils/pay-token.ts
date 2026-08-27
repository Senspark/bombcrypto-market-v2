/**
 * Map a pay-token contract address to its display name (BCOIN / SEN),
 * mirroring BaseSubscriber.getPayTokenName so synced rows match indexed ones.
 * Falls back to the raw address when unknown.
 */
export function resolvePayTokenName(
    tokenAddress: string,
    bcoinAddress: string,
    senAddress: string
): string {
    const addr = tokenAddress.toLowerCase();

    if (bcoinAddress && addr === bcoinAddress.toLowerCase()) {
        return 'BCOIN';
    }

    if (senAddress && addr === senAddress.toLowerCase()) {
        return 'SEN';
    }

    return tokenAddress;
}
