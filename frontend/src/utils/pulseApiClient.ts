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

const pulseApiClient = axios.create({
  // Fallback to the live production endpoint if the environment variable is missing
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? (import.meta.env.VITE_API_BASE_URL.endsWith('/') ? import.meta.env.VITE_API_BASE_URL : `${import.meta.env.VITE_API_BASE_URL}/`)
    : 'https://market.bombcrypto.io/api/bsc/', // Point directly to the live API base
  timeout: 10000,
});

// Since the client accesses the real production API, it might fail CORS or get
// rate-limited if accessed incorrectly. This makes sure it handles errors gracefully.
pulseApiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('pulseApiClient error:', error);
    return Promise.reject(error);
  }
);

export default pulseApiClient;
