import { RPC_URLS_GENERAL_USE } from "../lib/rpcManager.js";
import { normalizeNetwork } from "../utils/network.js";
import { getBlockNumberManager } from "../utils/rpc.js";

async function handleLatestBlockNumber(req, res) {
  const { network } = req.query;
  const normalizedNetwork = normalizeNetwork(network);

  if (!normalizedNetwork || !RPC_URLS_GENERAL_USE[normalizedNetwork]) {
    return res.status(400).json({
      success: false,
      errorString: "Invalid network. Supported: polygon, bsc (or aliases: pol, POL, BSC)",
      result: null,
    });
  }

  if (RPC_URLS_GENERAL_USE[normalizedNetwork].length === 0) {
    return res.status(400).json({
      success: false,
      errorString: `No RPC URLs configured for network: ${normalizedNetwork}`,
      result: null,
    });
  }

  try {
    const manager = getBlockNumberManager(normalizedNetwork);
    const blockNumber = await manager.getBlockNumber();

    return res.json({
      success: true,
      errorString: "",
      result: blockNumber,
    });
  } catch (error) {
    console.error("Block number fetch error:", error);
    return res.status(500).json({
      success: false,
      errorString: error.message,
      result: null,
    });
  }
}

export { handleLatestBlockNumber };
