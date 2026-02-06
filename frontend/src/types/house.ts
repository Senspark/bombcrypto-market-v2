/**
 * BHouse type definitions
 */

export interface BHouse {
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
  capacity: number;
  recovery: number;
  nft_block_number: number;

  // Frontend-added fields
  isToken?: string;
}
