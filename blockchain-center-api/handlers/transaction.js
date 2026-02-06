import { RPC_URLS_GENERAL_USE } from "../lib/rpcManager.js";
import { normalizeNetwork } from "../utils/network.js";
import {
  REQUEST_TIMEOUT_MS,
  getRpcManagerGeneral,
  fetchWithTimeout,
  extractStatusCode,
  withProvider,
} from "../utils/rpc.js";

function validateTxHash(txHash) {
  if (!txHash || typeof txHash !== "string") {
    return "txHash is required";
  }
  if (!txHash.startsWith("0x")) {
    return "txHash must be 0x-prefixed";
  }
  if (txHash.length !== 66) {
    return "txHash must be 66 characters (0x + 64 hex chars)";
  }
  return null;
}

function validateTransactionRequest(body) {
  const { network, txHash } = body;
  const normalizedNetwork = normalizeNetwork(network);

  if (!normalizedNetwork || !RPC_URLS_GENERAL_USE[normalizedNetwork]) {
    return "Invalid network. Supported: polygon, bsc (or aliases: pol, POL, BSC)";
  }

  if (RPC_URLS_GENERAL_USE[normalizedNetwork].length === 0) {
    return `No RPC URLs configured for network: ${normalizedNetwork}`;
  }

  const txHashError = validateTxHash(txHash);
  if (txHashError) {
    return txHashError;
  }

  return null;
}

async function executeRpcCall(rpcManager, rpcMethod, txHash) {
  const maxRetries = rpcManager.getRpcCount();
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const rpcUrl = await rpcManager.getNextRpc();
    // console.log(`Attempt ${attempt + 1}/${maxRetries}: Using RPC ${rpcUrl}`);

    try {
      const result = await withProvider(rpcUrl, async (provider) => {
        return await fetchWithTimeout(
          provider[rpcMethod](txHash),
          REQUEST_TIMEOUT_MS
        );
      });

      rpcManager.reportSuccess(rpcUrl);
      return { success: true, result };
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

async function handleGetTransaction(req, res) {
  const validationError = validateTransactionRequest(req.body);
  if (validationError) {
    return res.status(400).json({
      success: false,
      errorString: validationError,
      result: null,
    });
  }

  const { network, txHash } = req.body;
  const normalizedNetwork = normalizeNetwork(network);

  try {
    const rpcManager = getRpcManagerGeneral(normalizedNetwork);
    const result = await executeRpcCall(rpcManager, "getTransaction", txHash);

    if (result.success) {
      return res.json({
        success: true,
        errorString: "",
        result: result.result,
      });
    } else {
      return res.status(400).json({
        success: false,
        errorString: result.error,
        result: null,
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      errorString: error.message,
      result: null,
    });
  }
}

async function handleGetTransactionReceipt(req, res) {
  const validationError = validateTransactionRequest(req.body);
  if (validationError) {
    return res.status(400).json({
      success: false,
      errorString: validationError,
      result: null,
    });
  }

  const { network, txHash } = req.body;
  const normalizedNetwork = normalizeNetwork(network);

  try {
    const rpcManager = getRpcManagerGeneral(normalizedNetwork);
    const result = await executeRpcCall(rpcManager, "getTransactionReceipt", txHash);

    if (result.success) {
      return res.json({
        success: true,
        errorString: "",
        result: result.result,
      });
    } else {
      return res.status(400).json({
        success: false,
        errorString: result.error,
        result: null,
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      errorString: error.message,
      result: null,
    });
  }
}

export { handleGetTransaction, handleGetTransactionReceipt };
