# Bombcrypto Marketplace

NFT marketplace for Hero and House assets on BSC & Polygon.

## Architecture

```
Frontend (React) ---> Smart Contracts (BSC/Polygon)
                            |
                      Event Logs
                            |
Backend Subscribers ---> PostgreSQL <--- Backend API
        |                                    |
  blockchain-center-api          detect-transfer
        |
   Blockchain RPCs
```

## Project Structure

| Directory | Description |
|---|---|
| `frontend/` | Marketplace web UI — React, TypeScript, Vite |
| `backend/` | REST API + blockchain event subscribers — TypeScript, Express, ethers.js |
| `smc/` | Marketplace smart contracts — Solidity, Truffle, OpenZeppelin |
| `detect-transfer/` | Detects NFT transfers to invalidate stale listings — TypeScript, ethers.js |
| `blockchain-center-api/` | RPC proxy to cache and optimize blockchain calls — Node.js, Express |
| `db/` | PostgreSQL schema definitions |

## Prerequisites

- Node.js
- PostgreSQL
- Redis

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
