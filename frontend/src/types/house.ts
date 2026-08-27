/**
 * BHouse type definitions
 */

export interface BHouse {
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
  capacity: number;
  recovery: number;
  nftBlockNumber: number;

  // Frontend-added fields
  isToken?: string;
}
