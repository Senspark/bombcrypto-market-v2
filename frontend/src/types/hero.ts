/**
 * BHero type definitions
 */

export interface BHero {
  // Database/Transaction fields
  id: number;
  token_id: string;
  tx_hash: string;
  block_number: number;
  block_timestamp: string;
  status: string;
  seller_wallet_address: string;
  buyer_wallet_address: string;
  amount: string;
  pay_token: string;
  updated_at: string;

  // NFT attributes
  rarity: number;
  level: number;
  skin: number;
  color: number;
  stamina: number;
  speed: number;
  bomb_power: number;
  bomb_count: number;
  bomb_range: number;
  bomb_skin: number;
  abilities: number[];
  abilities_hero_s: number[];
  nft_block_number: number;

  // Frontend-added fields
  isToken?: string;
  ref_id?: number;
  index?: number;
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
