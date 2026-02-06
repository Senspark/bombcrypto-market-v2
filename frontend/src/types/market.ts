/**
 * Market/Order type definitions
 */

import { BHero } from './hero';
import { BHouse } from './house';

export interface MarketOrder {
  orderId: string;
  seller: string;
  tokenId: number;
  price: string;
  paymentToken: string;
  status: string;
}

export interface HeroListResponse {
  page: number;
  size: number;
  total_count: number;
  total_pages: number;
  transactions: BHero[];
}

export interface HouseListResponse {
  page: number;
  size: number;
  total_count: number;
  total_pages: number;
  transactions: BHouse[];
}

export interface HeroFilterParams {
  page?: number;
  size?: number;
  order_by?: string;
  status?: string[];
  seller_wallet_address?: string[];
  buyer_wallet_address?: string[];
  token_id?: number[];
  rarity?: number[];
  level?: string[];
  abilities?: number[];
  abilities_hero_s?: number[];
  pay_token?: string[];
  amount?: string[];
}

export interface HouseFilterParams {
  page?: number;
  size?: number;
  order_by?: string;
  status?: string[];
  seller_wallet_address?: string[];
  buyer_wallet_address?: string[];
  token_id?: number[];
  rarity?: number[];
  pay_token?: string[];
  amount?: string[];
}
