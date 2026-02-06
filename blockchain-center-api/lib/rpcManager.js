import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { analytics } from "./analytics.js";

// Load RPC config from external file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, "..", "rpc.config.json");

let rpcConfig;
try {
  rpcConfig = JSON.parse(readFileSync(configPath, "utf-8"));
} catch {
  console.error(`Failed to load RPC config from ${configPath}`);
  console.error("Copy rpc.config.example.json to rpc.config.json and configure your RPC URLs.");
  process.exit(1);
}

const RPC_URLS_SUPPORT_GET_LOGS = rpcConfig.getLogs;
const RPC_URLS_GENERAL_USE = rpcConfig.general;

// Central RPC state store (by URL) - state is tied to URL, not manager
const rpcStates = new Map();

function getRpcState(url) {
  if (!rpcStates.has(url)) {
    rpcStates.set(url, { readyAt: 0, inFlight: false, paused: false });
  }
  return rpcStates.get(url);
}

function toggleRpcPause(url) {
  const state = getRpcState(url);
  state.paused = !state.paused;
  if (!state.paused) {
    state.readyAt = 0; // Make immediately available on resume
  }
  console.log(`RPC ${state.paused ? "paused" : "resumed"}: ${url}`);
  return state.paused;
}

const COOLDOWN_MS = {
  default: 1000,
  rateLimit: 60000,
  serverError: 10000,
};

class RpcManager {
  constructor(network, rpcUrls, fallbackUrls = null) {
    this.urls = rpcUrls[network] || [];
    this.fallbackUrls = fallbackUrls ? (fallbackUrls[network] || []) : [];
    this.currentIndex = 0;
    this.fallbackIndex = 0;

    if (this.urls.length === 0) {
      throw new Error(`No RPC URLs configured for network: ${network}`);
    }
  }

  async getNextRpc() {
    // Try primary URLs
    const primaryUrl = this._findReadyUrl(this.urls, "currentIndex");
    if (primaryUrl) return primaryUrl;

    // Try fallback URLs
    if (this.fallbackUrls.length > 0) {
      const fallbackUrl = this._findReadyUrl(this.fallbackUrls, "fallbackIndex");
      if (fallbackUrl) {
        console.log(`Using fallback RPC: ${fallbackUrl}`);
        return fallbackUrl;
      }
    }

    // Neither ready - wait for soonest
    return this._waitForReady();
  }

  _findReadyUrl(urls, indexKey) {
    const now = Date.now();
    const startIndex = this[indexKey];

    for (let i = 0; i < urls.length; i++) {
      const index = (startIndex + i) % urls.length;
      const url = urls[index];
      const state = getRpcState(url);

      if (state.readyAt <= now && !state.inFlight && !state.paused) {
        state.inFlight = true;
        analytics.recordRpcCall(url);
        this[indexKey] = (index + 1) % urls.length;
        return url;
      }
    }
    return null;
  }

  async _waitForReady() {
    const allUrls = [...this.urls, ...this.fallbackUrls];
    const now = Date.now();

    // Find soonest ready URL that's not in flight
    const available = allUrls
      .map((url) => ({ url, state: getRpcState(url) }))
      .filter(({ state }) => !state.inFlight && !state.paused);

    if (available.length === 0) {
      console.log("All RPCs in flight. Waiting...");
      await this.sleep(100);
      return this.getNextRpc();
    }

    const soonest = available.reduce((min, curr) =>
      curr.state.readyAt < min.state.readyAt ? curr : min
    );

    const waitTime = Math.max(0, soonest.state.readyAt - now);
    if (waitTime > 0) {
      console.log(`All RPCs on cooldown. Waiting ${waitTime}ms for ${soonest.url}`);
      analytics.recordCooldownWait();
      await this.sleep(waitTime);
    }

    soonest.state.inFlight = true;
    analytics.recordRpcCall(soonest.url);
    return soonest.url;
  }

  reportSuccess(url) {
    const state = getRpcState(url);
    state.inFlight = false;
    state.readyAt = Date.now() + COOLDOWN_MS.default;
    analytics.recordSuccess(url);
  }

  reportError(url, statusCode) {
    const state = getRpcState(url);
    state.inFlight = false;
    analytics.recordFailure(url);

    const now = Date.now();

    if (statusCode === 429) {
      state.readyAt = now + COOLDOWN_MS.rateLimit;
      console.log(`RPC ${url} rate limited. Cooldown: 60s`);
    } else if (statusCode >= 500) {
      state.readyAt = now + COOLDOWN_MS.serverError;
      console.log(`RPC ${url} server error (${statusCode}). Cooldown: 10s`);
    } else if (statusCode >= 400) {
      console.log(`RPC ${url} client error (${statusCode}). Skipping to next.`);
    }
  }

  // These methods only return primary URLs to avoid duplicates in monitor
  // (fallback URLs are already shown by the getLogs manager)
  getRpcCount() {
    return this.urls.length;
  }

  getStatus() {
    const now = Date.now();
    return this.urls.map((url) => {
      const state = getRpcState(url);
      return {
        url,
        readyAt: state.readyAt,
        inFlight: state.inFlight,
        paused: state.paused,
        ready: state.readyAt <= now && !state.inFlight && !state.paused,
      };
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export { RpcManager, RPC_URLS_SUPPORT_GET_LOGS, RPC_URLS_GENERAL_USE, toggleRpcPause };
