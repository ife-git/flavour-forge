// client/src/config.js
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "" // ← Empty string uses relative URLs
    : "http://localhost:3001");

console.log("🌐 API URL:", API_URL);
