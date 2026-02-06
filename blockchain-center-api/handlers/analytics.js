import { allNetworks, rpcManagersForLogs, rpcManagersGeneral } from "../utils/rpc.js";
import { analytics } from "../lib/analytics.js";

function handleAnalytics(req, res) {
  const status = {};

  for (const network of allNetworks) {
    status[network] = {
      getLogs: rpcManagersForLogs[network].getStatus(),
      general: rpcManagersGeneral[network].getStatus(),
    };
  }

  const stats = analytics.getStats();

  return res.json({
    ...stats,
    status,
  });
}

export { handleAnalytics };
