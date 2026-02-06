import { RPC_URLS_SUPPORT_GET_LOGS } from "../lib/rpcManager.js";
import { normalizeNetwork } from "../utils/network.js";
import {
  REQUEST_TIMEOUT_MS,
  getRpcManagerForLogs,
  fetchWithTimeout,
  extractStatusCode,
  withProvider,
} from "../utils/rpc.js";

function validateGetLogsRequest(body) {
  const { network, address, topics, fromBlock, toBlock } = body;
  const normalizedNetwork = normalizeNetwork(network);

  if (!normalizedNetwork || !RPC_URLS_SUPPORT_GET_LOGS[normalizedNetwork]) {
    return "Invalid network. Supported: polygon, bsc (or aliases: pol, POL, BSC)";
  }

  if (RPC_URLS_SUPPORT_GET_LOGS[normalizedNetwork].length === 0) {
    return `No RPC URLs configured for network: ${normalizedNetwork}`;
  }

  if (!address || typeof address !== "string" || !address.startsWith("0x")) {
    return "Invalid address";
  }

  if (!Array.isArray(topics)) {
    return "topics must be an array";
  }

  if (typeof fromBlock !== "number" || fromBlock < 0) {
    return "fromBlock must be a non-negative number";
  }

  if (typeof toBlock !== "number" || toBlock < fromBlock) {
    return "toBlock must be a number >= fromBlock";
  }

  return null;
}

async function executeGetLogs(rpcManager, filter) {
  const maxRetries = rpcManager.getRpcCount();
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const rpcUrl = await rpcManager.getNextRpc();
    // console.log(`Attempt ${attempt + 1}/${maxRetries}: Using RPC ${rpcUrl}`);

    try {
      const logs = await withProvider(rpcUrl, async (provider) => {
        return await fetchWithTimeout(
          provider.getLogs(filter),
          REQUEST_TIMEOUT_MS
        );
      });

      rpcManager.reportSuccess(rpcUrl);
      return { success: true, logs };
    } catch (error) {
      lastError = error;
      const statusCode = extractStatusCode(error);
      console.log(`RPC ${rpcUrl} failed: ${error.message} (status: ${statusCode})`);
      rpcManager.reportError(rpcUrl, statusCode);
    }
  }

  return {
    success: false,
    error: lastError?.message || "All RPCs exhausted",
  };
}

async function handleGetLogs(req, res) {
  const validationError = validateGetLogsRequest(req.body);
  if (validationError) {
    return res.status(400).json({
      success: false,
      errorString: validationError,
      result: [],
    });
  }

  const { network, address, topics, fromBlock, toBlock } = req.body;
  const normalizedNetwork = normalizeNetwork(network);

  const filter = {
    address,
    topics,
    fromBlock,
    toBlock,
  };

  try {
    const rpcManager = getRpcManagerForLogs(normalizedNetwork);
    const result = await executeGetLogs(rpcManager, filter);

    if (result.success) {
      const formattedLogs = result.logs.map((log) => ({
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        logIndex: log.index,
        topics: log.topics,
        data: log.data,
      }));

      return res.json({
        success: true,
        errorString: "",
        result: formattedLogs,
      });
    } else {
      return res.status(400).json({
        success: false,
        errorString: result.error,
        result: [],
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      errorString: error.message,
      result: [],
    });
  }
}

export { validateGetLogsRequest, handleGetLogs };
