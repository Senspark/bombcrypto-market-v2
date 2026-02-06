# 🏗️ Architecture & Flows

> **Status:** Live & Verified
> **Last Updated:** 2024-05-22
> **Author:** Deep Scribe

This document details the internal mechanics of the Bombcrypto Marketplace.

---

## 🔄 Critical Flows

### 1. Listing an Item (Seller Journey)

The listing process relies on an event-driven architecture. The API does **not** create listings directly; it only reads them after the blockchain event is indexed.

```mermaid
sequenceDiagram
    participant User as Seller
    participant FE as Frontend
    participant SC as Smart Contract (Market)
    participant Sub as HeroSubscriber
    participant DB as Database

    User->>FE: Click "Sell Hero"
    FE->>SC: Call `createOrder(tokenId, price)`
    SC->>SC: Validate Ownership & Approval
    SC->>SC: Store Order
    SC--)Sub: Emit `CreateOrder` Event
    Note right of SC: Event contains Price, TokenID, Seller

    loop Polling / Listening
        Sub->>SC: Listen for Events
        Sub->>DB: Upsert into `hero_orders`
    end

    DB-->>FE: Data Available via API
    Note right of DB: Status = 'listing'
```

### 2. Buying an Item (Buyer Journey)

Similar to listing, buying is confirmed via blockchain events.

```mermaid
sequenceDiagram
    participant User as Buyer
    participant FE as Frontend
    participant SC as Smart Contract (Market)
    participant Sub as HeroSubscriber
    participant DB as Database

    User->>FE: Click "Buy Hero"
    FE->>SC: Call `buy(tokenId)`
    SC->>SC: Validate Price & Balance
    SC->>SC: Transfer NFT (Seller -> Buyer)
    SC->>SC: Transfer Funds (Buyer -> Seller - Fee)
    SC--)Sub: Emit `Sold` Event

    loop Polling / Listening
        Sub->>SC: Listen for Events
        Sub->>DB: Update `hero_orders`
    end
    Note right of DB: Status = 'sold'
```

---

## 🗄️ Entity Relationship Diagram (ERD)

The database uses a schema-per-chain strategy (`bsc`, `polygon`). The structure below applies to both.

```mermaid
erDiagram
    hero_orders {
        bigint id PK
        citext tx_hash UK
        bigint token_id
        numeric price "amount"
        citext seller_wallet_address
        citext buyer_wallet_address
        varchar status "listing | sold | canceled"
        jsonb stats "Attributes like speed, power"
        timestamp created_at
    }

    house_orders {
        bigint id PK
        citext tx_hash UK
        bigint token_id
        numeric price
        citext seller_wallet_address
        varchar status
    }

    hero_subscriber_block_number {
        boolean id PK
        bigint block_number "Last synced block"
    }

    hero_orders ||--o{ hero_subscriber_block_number : "Tracks Sync State"
```

---

## 📂 Folder Structure Analysis

### `backend/` (The API & Workers)
The backend is a hybrid: it serves the API *and* runs the blockchain subscribers.
*   **`src/api/`**: Express.js REST API.
    *   `handlers/`: Request processing logic.
    *   `routes/`: URL definition.
*   **`src/subscribers/`**: The "Workers" of the system.
    *   `hero-subscriber.ts`: Listens for Hero events.
    *   `house-subscriber.ts`: Listens for House events.

### `frontend/` (The Interface)
A standard React 17 + Vite application.
*   **`src/views/`**: Page-level components (`market.tsx`).
*   **`src/components/`**: Reusable UI elements (`forms/`, `list/`).
*   **`src/context/`**: Global state (Wallet, User).

### `smc/` (The Trust Layer)
Solidity Smart Contracts managed by Truffle.
*   `contracts/MarketCore.sol`: The abstract base for marketplace logic.
*   `contracts/BHeroMarket.sol`: The concrete implementation for Heroes.
