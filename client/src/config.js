// client/src/config.js
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://flavour-forge-backend.onrender.com" // ← Your Render backend URL
    : "http://localhost:3001");

console.log("🌐 API URL:", API_URL);
