import { REQUEST_TIMEOUT_MS, fetchWithTimeout, extractStatusCode, withProvider } from "../utils/rpc.js";

const BLOCK_TIME_MS = {
  polygon: 2000,
  bsc: 3000,
};
const REFRESH_INTERVAL_MS = 60000; // Force refresh every 60 seconds

class BlockNumberManager {
  constructor(network, rpcManager) {
    this.network = network;
    this.rpcManager = rpcManager;
    this.blockNumber = null;
    this.lastFetchedAt = 0;
  }

  async getBlockNumber() {
    const now = Date.now();

    // Fetch from RPC if never fetched or refresh interval elapsed
    if (this.blockNumber === null || now - this.lastFetchedAt >= REFRESH_INTERVAL_MS) {
      await this.fetchBlockNumber();
    }

    // Calculate estimated current block based on elapsed time
    const elapsedMs = now - this.lastFetchedAt;
    const blockTimeMs = BLOCK_TIME_MS[this.network] || 2000;
    const blocksElapsed = Math.floor(elapsedMs / blockTimeMs);
    const estimatedBlock = this.blockNumber + blocksElapsed;

    // Return block - 1 for safety margin (reorg protection)
    return estimatedBlock - 1;
  }

  async fetchBlockNumber() {
    const maxRetries = this.rpcManager.getRpcCount();
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const rpcUrl = await this.rpcManager.getNextRpc();

      try {
        const blockNumber = await withProvider(rpcUrl, async (provider) => {
          return await fetchWithTimeout(
            provider.getBlockNumber(),
            REQUEST_TIMEOUT_MS
          );
        });

        this.blockNumber = blockNumber;
        this.lastFetchedAt = Date.now();
        this.rpcManager.reportSuccess(rpcUrl);
        return;
      } catch (error) {
        lastError = error;
        const statusCode = extractStatusCode(error);
        console.log(`BlockNumber fetch failed from ${rpcUrl}: ${error.message}`);
        this.rpcManager.reportError(rpcUrl, statusCode);
      }
    }

    throw new Error(lastError?.message || "All RPCs exhausted");
  }
}

export { BlockNumberManager };
