const NETWORK_ALIASES = {
  bsc: "bsc",
  pol: "polygon",
  polygon: "polygon",
};

function normalizeNetwork(network) {
  if (!network) return null;
  return NETWORK_ALIASES[network.toLowerCase()] || null;
}

export { NETWORK_ALIASES, normalizeNetwork };
