import {HeroRepr} from '@/domain/models/hero';
import {HouseRepr} from '@/domain/models/house';

// Bit masks for extracting metadata
const MASK_30_BITS = (1n << 30n) - 1n;
const MASK_10_BITS = (1n << 10n) - 1n;
const MASK_15_BITS = (1n << 15n) - 1n;
const MASK_5_BITS = 31n; // (1 << 5) - 1 = 31

// Extract a 5-bit attribute at the given bit offset
function getAttribute(details: bigint, offset: number): number {
    return Number((details >> BigInt(offset)) & MASK_5_BITS);
}

// Parse hero details from tokenDetail bigint string
export function parseHeroDetails(detailsStr: string): HeroRepr {
    const details = BigInt(detailsStr);

    // Token ID: bits 0-29
    const id = Number(details & MASK_30_BITS);

    // Index: bits 30-39
    const index = Number((details >> 30n) & MASK_10_BITS);

    // Other attributes (5 bits each)
    const rarity = getAttribute(details, 40);
    const level = getAttribute(details, 45);
    const color = getAttribute(details, 50);
    const skin = getAttribute(details, 55);
    const stamina = getAttribute(details, 60);
    const speed = getAttribute(details, 65);
    const bombSkin = getAttribute(details, 70);
    const bombCount = getAttribute(details, 75);
    const bombPower = getAttribute(details, 80);
    const bombRange = getAttribute(details, 85);

    // Number of abilities at bit 90
    const noOfAbilities = getAttribute(details, 90);
    const abilities: number[] = [];
    for (let i = 0; i < noOfAbilities; i++) {
        abilities.push(getAttribute(details, 95 + i * 5));
    }

    // Number of Hero S abilities at bit 180
    const noOfAbilitiesHeroS = getAttribute(details, 180);
    const abilitiesHeroS: number[] = [];
    for (let i = 0; i < noOfAbilitiesHeroS; i++) {
        abilitiesHeroS.push(getAttribute(details, 185 + i * 5));
    }

    // NFT block number: bits 145-174 (30 bits)
    const nftBlockNumber = Number((details >> 145n) & MASK_30_BITS);

    return {
        id,
        index,
        rarity,
        level,
        color,
        skin,
        stamina,
        speed,
        bombSkin,
        bombCount,
        bombPower,
        bombRange,
        abilities,
        abilitiesHeroS,
        nftBlockNumber,
    };
}

// Parse house details from tokenDetail bigint string
export function parseHouseDetails(detailsStr: string): HouseRepr {
    const details = BigInt(detailsStr);

    // Token ID: bits 0-29
    const id = Number(details & MASK_30_BITS);

    // Index: bits 30-39
    const index = Number((details >> 30n) & MASK_10_BITS);

    // Rarity: bits 40-44 (5 bits)
    const rarity = getAttribute(details, 40);

    // Recovery: bits 45-59 (15 bits)
    const recovery = Number((details >> 45n) & MASK_15_BITS);

    // Capacity: bits 60-64 (5 bits)
    const capacity = getAttribute(details, 60);

    // NFT block number: bits 65-94 (30 bits)
    const nftBlockNumber = Number((details >> 65n) & MASK_30_BITS);

    return {
        id,
        index,
        rarity,
        recovery,
        capacity,
        nftBlockNumber,
    };
}

// Convert abilities array to space-separated string (for database storage)
export function abilitiesToString(abilities: number[]): string {
    return abilities.join(' ');
}

// Parse abilities from space-separated string
export function parseAbilitiesString(abilitiesStr: string): number[] {
    if (!abilitiesStr || abilitiesStr.trim() === '') {
        return [];
    }
    return abilitiesStr
        .split(' ')
        .map(s => parseInt(s, 10))
        .filter(n => !isNaN(n));
}
