import axios from 'axios';

// =========================================================================
// 🌟 PULSE ANALYTICS API CLIENT
// =========================================================================
// Welcome open-source contributors! 🚀
//
// This dedicated Axios instance powers the Pulse Dashboards.
// It bypasses the legacy global `getAPI()` logic to explicitly use the
// `VITE_API_BASE_URL` defined in your `.env.development` file.
//
// Why?
// This allows you to instantly spin up `pnpm dev` and see real live data
// on the analytics dashboards without needing to install, configure,
// or seed a local PostgreSQL database!
//
// Happy Hacking! 💣
// =========================================================================

/**
 * Pulse API Axios Client
 *
 * Centralized client for fetching analytics data.
 *
 * **Vite Proxy Mechanism**:
 * To bypass CORS restrictions when fetching live data from production APIs
 * during local development, this client utilizes the `VITE_API_BASE_URL` env variable.
 * In `vite.config.ts`, this URL (e.g., `/pulse-api/bsc`) is proxy-mapped to the
 * real production endpoint (e.g., `https://market.bombcrypto.io/api/bsc`).
 *
 * **Network Switching (BNB/POL)**:
 * By default, this uses the base URL configured in your environment variables.
 * However, specific views (like `PulseBHeroDashboard`) can dynamically override
 * the request URL to switch between BNB (`/pulse-api/bsc`) and Polygon
 * (`/pulse-api/polygon`) endpoints based on user selection in the UI.
 */
const pulseApiClient = axios.create({
  // Fallback to the live production endpoint if the environment variable is missing
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? (import.meta.env.VITE_API_BASE_URL.endsWith('/') ? import.meta.env.VITE_API_BASE_URL : `${import.meta.env.VITE_API_BASE_URL}/`)
    : 'https://market.bombcrypto.io/api/bsc/', // Point directly to the live API base
  timeout: 10000,
});

/**
 * Global response interceptor.
 *
 * Since the client accesses the real production API (via proxy in dev),
 * it might fail CORS (if proxy is misconfigured) or get rate-limited.
 * This ensures we log and gracefully reject those errors for the UI to handle.
 */
pulseApiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('pulseApiClient error:', error);
    return Promise.reject(error);
  }
);

export default pulseApiClient;
