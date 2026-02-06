# detect-transfer-ts

NFT marketplace order verification service. Monitors when NFTs are transferred out of wallets and automatically marks marketplace listings as "deleted" to prevent buyers from purchasing non-existent inventory.

## Features

- Monitors 4 marketplaces: BSC Hero, BSC House, Polygon Hero, Polygon House
- Dual RPC strategy: Premium RPC for expensive operations, free RPC rotation for general calls
- Health tracking with automatic cooldowns for rate-limited or failing RPCs
- Redis-based queue for order verification with cooldown to prevent re-checking

## Prerequisites

- Node.js 20+
- PostgreSQL database with `bsc` and `polygon` schemas
- Redis instance
- RPC endpoints for BSC and Polygon networks

## Environment Variables

See `.env.example` for required configuration.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Type check
npm run typecheck

# Build
npm run build

# Run production build
npm start
```

## Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f detect-transfer
```

## Architecture

```
src/
├── main.ts                 # Entry point
├── config/                 # Configuration with Zod validation
├── core/
│   └── subscriber.ts       # Main Subscriber class
├── infrastructure/
│   ├── database/          # PostgreSQL pool
│   ├── redis/             # Redis client
│   └── rpc/               # RPC management (dual client, health tracking)
├── contracts/             # Contract ABIs and types
└── utils/                 # Logger
```

## How It Works

1. Pop order ID from Redis set (`MKP_{TYPE}_SEARCH_IDS_{NETWORK}`)
2. Check if order is in cooldown
3. Fetch order record from PostgreSQL
4. Verify on-chain:
   - Order exists on market contract
   - Token owner matches seller
   - Market contract is approved
5. Mark as deleted if any check fails
6. Set 15-minute cooldown to prevent re-checking
