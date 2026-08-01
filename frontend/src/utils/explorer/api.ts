import axios from "axios";
import { getAPI } from "../helper";
import { networkToUrlParam } from "../config";

/**
 * Client for the stake rankings + explorer endpoints served by the
 * marketplace backend (/rankings/* and /explorer/*).
 */

export type StakeToken = "BCOIN" | "SEN";

/**
 * The game database holds every network, so the API is told explicitly which
 * one to answer for instead of relying on which instance serves the request.
 */
function networkQuery(network: string): string {
  return "network=" + networkToUrlParam(network);
}

export interface RankedHero {
  rank: number | null;
  /** 'BSC' | 'POLYGON' - shown as a badge on consolidated rankings. */
  network: string;
  bomber_id: number;
  rarity: number;
  level: number;
  power: number;
  stamina: number;
  speed: number;
  bomb_count: number;
  bomb_range: number;
  abilities: number[];
  skin: number;
  color: number;
  stake_bcoin: number;
  stake_sen: number;
  wallet: string | null;
}

export interface HeroStakeSummary {
  stake_bcoin: number;
  stake_sen: number;
  heroes: number;
  biggest_stake: number;
  avg_stake: number;
}

export interface HeroStakeRankingResponse {
  token: StakeToken;
  rarity: number | null;
  page: number;
  size: number;
  total_count: number;
  total_pages: number;
  summary: HeroStakeSummary;
  items: RankedHero[];
}

export interface RankedWallet {
  rank: number | null;
  wallet: string;
  heroes: number;
  heroes_staked: number;
  stake_bcoin: number;
  stake_sen: number;
}

export interface WalletStakeSummary {
  stake_bcoin: number;
  stake_sen: number;
  wallets: number;
  biggest_stake: number;
  avg_stake: number;
}

export interface WalletStakeRankingResponse {
  token: StakeToken;
  page: number;
  size: number;
  total_count: number;
  total_pages: number;
  summary: WalletStakeSummary;
  items: RankedWallet[];
}

export interface WalletHouse {
  house_id: number;
  rarity: number;
  recovery: number;
  max_bomber: number;
  active: number;
}

export interface WalletProfile {
  wallet: string;
  heroes: number;
  heroes_staked: number;
  stake_bcoin: number;
  stake_sen: number;
  rank_bcoin: number | null;
  rank_sen: number | null;
  houses: WalletHouse[];
}

export interface WalletHeroesResponse {
  page: number;
  size: number;
  total_count: number;
  total_pages: number;
  items: RankedHero[];
}

export interface HeroDetail extends Omit<RankedHero, "rank"> {
  has_delete: boolean;
  /** A create-rock burn record contains this hero. */
  burned: boolean;
  shield_level: number;
  /** rank_* / rank_*_rarity: within the hero's network; rank_*_global: all networks. */
  rank_bcoin: number | null;
  rank_bcoin_rarity: number | null;
  rank_bcoin_global: number | null;
  rank_bcoin_global_rarity: number | null;
  rank_sen: number | null;
  rank_sen_rarity: number | null;
  rank_sen_global: number | null;
  rank_sen_global_rarity: number | null;
}

export interface HouseDetail {
  house_id: number;
  rarity: number;
  recovery: number;
  max_bomber: number;
  active: number;
  wallet: string | null;
}

export async function fetchHeroStakeRanking(
  network: string,
  params: { token: StakeToken; rarity: number | null; consolidated: boolean; page: number; size: number }
): Promise<HeroStakeRankingResponse> {
  const query = new URLSearchParams({
    token: params.token.toLowerCase(),
    network: networkToUrlParam(network),
    page: String(params.page),
    size: String(params.size),
  });
  if (params.rarity !== null) query.set("rarity", String(params.rarity));
  if (params.consolidated) query.set("all", "1");
  const res = await axios.get(getAPI(network) + "rankings/stake/heroes?" + query.toString());
  return res.data;
}

export async function fetchWalletStakeRanking(
  network: string,
  params: { token: StakeToken; consolidated: boolean; page: number; size: number }
): Promise<WalletStakeRankingResponse> {
  const query = new URLSearchParams({
    token: params.token.toLowerCase(),
    network: networkToUrlParam(network),
    page: String(params.page),
    size: String(params.size),
  });
  if (params.consolidated) query.set("all", "1");
  const res = await axios.get(getAPI(network) + "rankings/stake/wallets?" + query.toString());
  return res.data;
}

export async function fetchWalletProfile(
  network: string,
  wallet: string,
  consolidated = false
): Promise<WalletProfile> {
  const res = await axios.get(
    getAPI(network) +
      "explorer/wallet/" +
      encodeURIComponent(wallet) +
      "?" +
      networkQuery(network) +
      (consolidated ? "&all=1" : "")
  );
  return res.data;
}

export async function fetchWalletHeroes(
  network: string,
  wallet: string,
  params: { stakedOnly: boolean; page: number; size: number }
): Promise<WalletHeroesResponse> {
  const query = new URLSearchParams({
    network: networkToUrlParam(network),
    page: String(params.page),
    size: String(params.size),
  });
  if (params.stakedOnly) query.set("staked", "1");
  const res = await axios.get(
    getAPI(network) + "explorer/wallet/" + encodeURIComponent(wallet) + "/heroes?" + query.toString()
  );
  return res.data;
}

export async function fetchHeroDetail(network: string, heroId: string): Promise<HeroDetail> {
  const res = await axios.get(
    getAPI(network) + "explorer/hero/" + encodeURIComponent(heroId) + "?" + networkQuery(network)
  );
  return res.data;
}

export async function fetchHouseDetail(network: string, houseId: string): Promise<HouseDetail> {
  const res = await axios.get(
    getAPI(network) + "explorer/house/" + encodeURIComponent(houseId) + "?" + networkQuery(network)
  );
  return res.data;
}
