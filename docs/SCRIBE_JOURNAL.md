# 📓 Scribe's Journal (Gap Analysis)

> **Status:** Open
> **Last Updated:** 2024-05-22
> **Author:** Deep Scribe

This journal documents architectural anomalies, technical debt, and potential risks identified during the Deep Scan.

---

## ⚠️ Ambiguities & Patterns

### 1. Direct API Calls in Components (Frontend)
*   **Observation**: The `market.tsx` component (and others) imports `axios` and makes direct HTTP requests inside the component logic.
*   **Risk**: Makes testing difficult and couples UI components to specific API implementations.
*   **Recommendation**: Move all API calls to a dedicated `services/api` layer or custom hooks (e.g., `useHeroSearch`).

### 2. Database Schema Redundancy
*   **Observation**: Presence of `hero_s_abilities` alongside `hero_abilities`.
*   **Ambiguity**: It is unclear if `hero_s_abilities` is a "Shadow Table" for specific "S-Tier" heroes or a deprecated table.
*   **Recommendation**: Investigate usage in `subscribers` to determine if this can be normalized.

---

## 🛑 Missing Validation & Error Handling

### 1. Frontend Error Swallowing
*   **Observation**: In `market.tsx`, the `fetch` function wraps the API call in a `try/catch` block but only logs the error to `console.error`.
*   **Risk**: Users are left in the dark if the API fails; the loading state might hang or show empty results without context.
*   **Recommendation**: Implement a global Error Boundary or Toast notification system for user feedback.

### 2. Manual Query Parsing (Backend)
*   **Observation**: `hero.handler.ts` manually parses query parameters (e.g., `parseArrayParam`).
*   **Risk**: High cognitive load and potential for edge-case bugs.
*   **Recommendation**: Leverage `zod` (already in `package.json`) to define strict schemas for query parameters and validate them automatically.

---

## 🔒 Security Observations

### 1. Reentrancy Protection (Smart Contracts)
*   **Observation**: `MarketCore.sol` correctly removes the order *before* transferring funds (`_removeOrder(_tokenId)` called before `tk.transferFrom`).
*   **Status**: 🟢 Safe. This adheres to the Checks-Effects-Interactions pattern.

### 2. Hardcoded / Derived API URLs
*   **Observation**: Frontend constructs URLs using string concatenation: `getAPI(network) + "transactions/..."`.
*   **Risk**: Fragile if API versioning changes structure.
*   **Recommendation**: Use a typed API client generator or centralized route definitions.
