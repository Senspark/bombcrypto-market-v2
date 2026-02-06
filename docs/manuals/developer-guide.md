# Developer Guide

## Prerequisites

-   **Node.js** (v18+)
-   **PostgreSQL** (v14+)
-   **Redis** (v6+)

## Project Structure

-   `backend/`: API and Blockchain Subscribers.
-   `frontend/`: React Application.
-   `smc/`: Smart Contracts (Truffle).
-   `detect-transfer/`: Service to clean up stale listings.
-   `blockchain-center-api/`: RPC Proxy.

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database named `market`.
```bash
psql -U postgres -c "CREATE DATABASE market;"
psql -U postgres -d market -f db/schema.sql
```

### 2. Backend API & Subscribers

Navigate to `backend/`:
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` to match your local credentials.

**Run in development:**
```bash
# Run API (BSC)
npm run dev:api:bsc

# Run Hero Subscriber (BSC)
npm run dev:hero:bsc

# Run House Subscriber (BSC)
npm run dev:house:bsc
```

### 3. Frontend

Navigate to `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
Access the UI at `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `POSTGRES_CONN_STR` | Postgres connection string. |
| `REDIS_URL` | Redis connection URL. |
| `BLOCKCHAIN_CENTER_API_URL` | URL of the RPC proxy. |
| `SERVER_PORT` | Port for the API (default 3003). |
| `SUBSCRIBER_HERO_CONTRACT_ADDRESS` | Address of the Hero Market contract. |
