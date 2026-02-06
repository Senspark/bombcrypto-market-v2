# API Reference

Base URL: `http://localhost:3003`

## Hero Routes
Base Path: `/hero`

| Method | Path | Description |
|---|---|---|
| `GET` | `/search` | Search for Hero listings with filters (rarity, stats, etc.). |
| `GET` | `/stats` | Get statistics about Hero sales. |
| `POST` | `/burn/:tokenId` | Remove a listing if the NFT was burnt (requires signature). |
| `GET` | `/version` | Get the current API version. |

## House Routes
Base Path: `/house`

| Method | Path | Description |
|---|---|---|
| `GET` | `/search` | Search for House listings with filters. |
| `GET` | `/stats` | Get statistics about House sales. |
| `POST` | `/burn/:tokenId` | Remove a listing if the NFT was burnt. |

## User Routes
Base Path: `/user`

| Method | Path | Description |
|---|---|---|
| `POST` | `/decode` | Decode encoded wallet details. |
| `GET` | `/:walletAddress/history` | Get transaction history for a specific wallet. |

## Admin Routes
Base Path: `/admin` (Requires API Key)

| Method | Path | Description |
|---|---|---|
| `GET` | `/control/cache/clear` | Clear the internal server cache. |
| `GET` | `/control/processing-numbers` | View the current block numbers being processed by subscribers. |
