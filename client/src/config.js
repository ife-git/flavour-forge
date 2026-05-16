// client/src/config.js
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://" // ← Changed to match your actual URL
    : "http://localhost:3001"); // backend port
console.log("🌐 API URL:", API_URL);
