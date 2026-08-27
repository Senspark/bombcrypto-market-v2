/**
 * BHero type definitions
 */

export interface BHero {
  // Database/Transaction fields
  id: number;
  tokenId: number;
  txHash: string;
  blockNumber: number;
  blockTimestamp: string;
  status: string;
  sellerWalletAddress: string;
  buyerWalletAddress: string;
  amount: string;
  payToken: string;
  updated_at: string;

  // NFT attributes
  rarity: number;
  level: number;
  skin: number;
  color: number;
  stamina: number;
  speed: number;
  bombPower: number;
  bombCount: number;
  bombRange: number;
  bombSkin: number;
  abilities: number[];
  abilitiesHeroS: number[];
  nftBlockNumber: number;

  // Frontend-added fields
  isToken?: string;
  ref_id?: number;
  index?: number;

  // Shield & Stake data (from backend)
  shieldData?: ShieldOutput | null;

  // Set when the hero or its seller is on the suspicious list (from backend)
  suspicious?: SuspiciousFlag | null;
}

/**
 * Marks a hero suspected of being obtained through fraud or a hacked account.
 * `matchedBy` tells whether the hero itself is listed, or the wallet selling it.
 */
export interface SuspiciousFlag {
  reason: string;
  note: string | null;
  matchedBy: "token" | "seller";
}

export interface ShieldOutput {
  shieldAmount: string;
  shieldLevel: number;
  heroType: string;
  rarity: string;
  currentStake: number;
  mustStake: number;
  currentStakeBcoin: number;
  currentStakeSen: number;
}
