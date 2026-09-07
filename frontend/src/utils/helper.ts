import { formatEther } from "ethers";
import _ from "lodash";
import { rest_api, NETWORK } from "./config";
import queryString from "query-string";
import axios, { AxiosResponse } from "axios";

// GET with retry: on error (network / non-2xx) retries up to `retries` times
// (default 3) with a short increasing backoff, then rethrows the last error.
export const axiosGetWithRetry = async <T = any>(
  url: string,
  retries = 3,
  delayMs = 800
): Promise<AxiosResponse<T>> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await axios.get<T>(url);
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

interface ColorMap {
  [key: number]: string;
}

const color1: ColorMap = {
  1: "blue",
  2: "green",
  3: "red",
  4: "white",
  5: "yellow",
};

const color4: ColorMap = {
  1: "blue",
  2: "green",
  3: "purple",
  4: "white",
  5: "yellow",
};

const color5: ColorMap = {
  1: "blue",
  2: "green",
  3: "red",
  4: "purple",
  5: "yellow",
};

const witch: ColorMap = {
  1: "blue",
  2: "green",
  3: "red",
  4: "purple",
  5: "yellow",
};

const color6: ColorMap = {
  6: "",
};

// Chess skins only ship in Blue (color id 1) and Red (color id 3).
const chess: ColorMap = {
  1: "blue",
  3: "red",
};

// NekoChan only ships in Red (color id 3) and White (color id 4).
const nekochan: ColorMap = {
  3: "red",
  4: "white",
};

interface HeroInfo {
  name: string;
  color: ColorMap;
}

const hero: Record<number, HeroInfo> = {
  0: { name: "unknown", color: color6 },
  1: { name: "frog", color: witch },
  2: { name: "knight", color: color1 },
  3: { name: "man", color: color4 },
  4: { name: "vampire", color: color5 },
  5: { name: "witch", color: witch },
  6: { name: "doge", color: color6 },
  7: { name: "pepe", color: color6 },
  8: { name: "ninja", color: color6 },
  9: { name: "king", color: color6 },
  10: { name: "rabbit", color: color6 },
  11: { name: "meo", color: color6 },
  12: { name: "monkey", color: color6 },
  13: { name: "pilot", color: color6 },
  14: { name: "cat", color: color6 },
  15: { name: "tiger", color: color6 },
  16: { name: "pugdog", color: color6 },
  17: { name: "sailormoon", color: color6 },
  18: { name: "pepeclown", color: color6 },
  19: { name: "froggentlemen", color: color6 },
  20: { name: "dragoon", color: color6 },
  21: { name: "ghost", color: color6 },
  22: { name: "pumpkin", color: color6 },
  23: { name: "werewolves", color: color6 },
  24: { name: "footballfrog", color: color6 },
  25: { name: "footballknight", color: color6 },
  26: { name: "footballman", color: color6 },
  27: { name: "footballvampire", color: color6 },
  28: { name: "footballwitch", color: color6 },
  29: { name: "footballdoge", color: color6 },
  30: { name: "footballpepe", color: color6 },
  31: { name: "footballninja", color: color6 },
  // Super skins 32..56 — single-color (color id ignored).
  32: { name: "superknight", color: color6 },
  33: { name: "supercowboy", color: color6 },
  34: { name: "superwitch", color: color6 },
  35: { name: "superninja", color: color6 },
  36: { name: "poo", color: color6 },
  37: { name: "gku", color: color6 },
  38: { name: "pinkytoon", color: color6 },
  39: { name: "stickman", color: color6 },
  40: { name: "monitor", color: color6 },
  41: { name: "dragon", color: color6 },
  42: { name: "santa", color: color6 },
  43: { name: "miner", color: color6 },
  44: { name: "calico", color: color6 },
  45: { name: "kuroneko", color: color6 },
  46: { name: "goldenkat", color: color6 },
  47: { name: "mrdear", color: color6 },
  48: { name: "tlion", color: color6 },
  49: { name: "superfrog", color: color6 },
  50: { name: "dogetr", color: color6 },
  // Chess King (51) — 2 colors Red/Blue.
  51: { name: "chessking", color: chess },
  52: { name: "cupid", color: color6 },
  53: { name: "bguy", color: color6 },
  54: { name: "pinkybear", color: color6 },
  // NekoChan (55) — 2 colors White/Red.
  55: { name: "nekochan", color: nekochan },
  56: { name: "hesman", color: color6 },
  57: { name: "chessqueen", color: chess },
  58: { name: "chesspawn", color: chess },
  59: { name: "chessrook", color: chess },
  60: { name: "chesshorse", color: chess },
  61: { name: "chessbishop", color: chess },
  // Batch 62..66 — single-color.
  62: { name: "irondeux", color: color6 },
  63: { name: "omega", color: color6 },
  64: { name: "saber", color: color6 },
  65: { name: "demonslayer", color: color6 },
  66: { name: "koiman", color: color6 },
};


const Rarity: Record<number, string> = {
  0: "Common",
  1: "Rare",
  2: "Super Rare",
  3: "Epic",
  4: "Legend",
  5: "SP Legend",
  6: "Mega",
  7: "Super Mega",
  8: "Mystic",
  9: "Super Mystic",
};

export const mapTag: Record<number, string> = {
  0: "common",
  1: "rare",
  2: "superrare",
  3: "epic",
  4: "legend",
  5: "superlegend",
  6: "mega",
  7: "supermega",
  8: "mystic",
  9: "supermystic",
};

export const skills: Record<number, string> = {
  1: "treasure_hunter_icon",
  2: "jail_breaker_icon",
  3: "pierce_block_icon",
  4: "save_battery_icon",
  5: "fast_charge_icon",
  6: "bomb_pass_icon",
  7: "block_pass_icon",
  8: "coming_soon_icon",
  9: "coming_soon_icon",
  10: "coming_soon_icon",
};

export const skillsDesc: Record<number, string> = {
  1: "+ 02 DMG when The Chest explodes",
  2: "+ 05 DMG when The Prison explodes",
  3: "+ Explode through The Block",
  4: "+ 20 % Rate not lost Mana when placing Bomb",
  5: "+ 0,5 Stamina/Min while Resting",
  6: "Go through The Bomb",
  7: "Go through The Block",
  8: "Coming soon",
  9: "Coming soon",
  10: "Coming soon",
};

export const mapHouse: Record<number, string> = {
  0: "Tiny House",
  1: "Mini House",
  2: "Lux House",
  3: "PentHouse",
  4: "Villa",
  5: "Super Villa",
};

export const skillsHeroS: Record<number, string> = {
  1: "shield_icon",
};

export const skillsDescHeroS: Record<number, string> = {
  1: "Immune to Thunder",
};

// Lv1 base durability per rarity, sourced from data.md / Phase 2 config_hero_upgrade_shield.
// Lv2/Lv3/Lv4 multiply by 2/3/4 respectively (server-side); this map shows the Lv1 base
// because the card-level UI doesn't know the hero's current shield level.
export const totalShieldHeroS: Record<number, string> = {
  0: "1000",
  1: "1125",
  2: "1250",
  3: "1500",
  4: "1750",
  5: "2000",
  6: "2250",
  7: "2500",
  8: "2750",
  9: "3000",
};

interface HouseDetail {
  name: string;
  size: string;
  charge: string;
  slot: number;
}

export const mapHouseDetail: Record<number, HouseDetail> = {
  0: { name: "Tiny House", size: "6x6", charge: "2/m", slot: 4 },
  1: { name: "Mini House", size: "6x10", charge: "5/m", slot: 6 },
  2: { name: "Lux House", size: "6x15", charge: "8/m", slot: 8 },
  3: { name: "PentHouse", size: "6x20", charge: "11/m", slot: 10 },
  4: { name: "Villa", size: "6x25", charge: "14/m", slot: 12 },
  5: { name: "Super Villa", size: "6x30", charge: "17/m", slot: 14 },
};

export const levelToPower: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 5,
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null;
  return function executedFunction(this: any, ...args: Parameters<T>) {
    const context = this;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
};

export const minAddress = (address: string | undefined | null): string | undefined => {
  if (!address) return;
  const first = address.slice(0, 4);
  const last = address.slice(address.length - 4, address.length);
  return first + "..." + last;
};

export const BcoinBalance = (numberOfToken: bigint | string | number | undefined | null): string | number => {
  if (!numberOfToken) return 0;
  const result = formatEther(numberOfToken);
  return result;
};

export const bcoinFormat = (numberOfToken: number | bigint | string | undefined | null): number => {
  if (typeof numberOfToken === 'number' && numberOfToken < 10000000000) return numberOfToken;
  if (!numberOfToken) return 0;
  const result = formatEther(String(numberOfToken));
  const bcoin = Math.ceil(Number(result) * 100) / 100;
  return bcoin;
};

export const numberFormat = (number: number | string | undefined | null, round: number = 4): string | number => {
  if (!number) return 0;
  const numberFormat = _.floor(Number(number), round);
  let num_parts = numberFormat.toString().split(".");
  num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return num_parts.join(".");
};

// Some source icons are drawn much wider than the rest (e.g. pepeclown's jester
// pom-poms stick out sideways), so at a fixed display width their character looks
// shrunken. We keep the original art intact and crop it visually at render time:
// `aspect` = visible width / height (portrait < 1). The image is fit by height and
// horizontally centered inside a clip box, so the side overflow is hidden.
export const heroIconCrop: Record<number, number> = {
  18: 0.7, // pepeclown
};

export const renderURLHero = (skin: number, skin_color: number): string => {
  let url = "";
  if (skin === 0) {
    skin = 1;
  }
  if (!hero.hasOwnProperty(skin)) {
    // fallback
    skin = 0;
  }
  const { name, color } = hero[skin];

  url += name;
  let colorName = color[skin_color];
  // Color id doesn't resolve → fall back to a variant this skin actually ships,
  // preferring white, then blue, else its first available color.
  // Single-color skins (color6 = {6:""}) have no real variant, so they stay suffix-less.
  if (!colorName) {
    const variants = Object.values(color).filter(Boolean);
    colorName = variants.includes("white")
      ? "white"
      : variants.includes("blue")
      ? "blue"
      : variants[0];
  }
  if (colorName) url += "_" + colorName;
  url += "_icon";
  return url;
};

export const mapRarity = (number: number): string => {
  return Rarity[number];
};

export const mapRarityShield = (number: number): string => {
  return totalShieldHeroS[number];
};

export const convertFilter = (payload: Record<string, any>): string => {
  const params = { ...payload };
  delete params.total_count;
  delete params.total_pages;
  let str: string[] = [];
  let str_array = "";
  for (var p in params)
    if (params.hasOwnProperty(p)) {
      if (!Array.isArray(params[p])) {
        if (params[p])
          str.push((p) + "=" + (params[p]));
      } else {
        const value = params[p] as any[];
        value.forEach((element) => {
          str_array += "&" + p + "=" + element;
        });
      }
    }

  return str.join("&") + str_array;
};

export const convertQueryToObject = (url: string): queryString.ParsedQuery<string> => {
  const parsed = queryString.parse(url);
  return parsed;
};

export const getAPI = (network: string): string => {
  if (network === NETWORK.BNB) {
    return rest_api.BNB;
  }
  return rest_api.Polygon;
};
