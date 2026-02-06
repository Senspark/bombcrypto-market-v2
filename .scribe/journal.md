# Scribe's Journal - Knowledge Gaps

This journal records ambiguities and gaps found in the codebase during the documentation process.

## 1. Logic Ambiguities

### Notification System (`HeroSubscriber.ts`)
-   **Observation**: The subscriber attempts to send a `GET` request to `soldNotifyUrl` when an item is sold.
-   **Gap**: There is no documentation on what service consumes this notification or the expected response format. It is "fire and forget" with a timeout.
-   **Risk**: If this notification fails, external systems (like a game server) might not know about the sale.

### Detect Transfer Service
-   **Observation**: There is a service named `detect-transfer`.
-   **Gap**: Its interaction with the main `backend` database is via shared DB access. This creates a hidden coupling between services.
-   **Recommendation**: Document this shared database pattern explicitly.

## 2. Configuration & Environment

### Hardcoded Contract Addresses
-   **Observation**: `.env.example` contains specific contract addresses for BSC/Polygon.
-   **Gap**: It is unclear if these are current mainnet addresses or testnet.
-   **Action**: Verify if these need to be updated for a new deployment.

## 3. Testing
-   **Observation**: Limited unit tests found for complex subscriber logic.
-   **Gap**: Risk of regression when modifying event parsing logic.

## 4. Documentation
-   **Observation**: `smc/README.md` contained images of diagrams (`./docs/*.png`) which are binary files and hard to maintain.
-   **Action**: Replaced with Mermaid.js code-based diagrams in the new `/docs` structure.
