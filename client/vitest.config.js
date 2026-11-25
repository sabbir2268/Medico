import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: true,
    // Tests must not depend on a developer's local (or production) .env.
    // Use the dev proxy path and the built-in fallback catalog in jsdom.
    env: {
      VITE_API_URL: "/api",
      VITE_USE_FALLBACK_DATA: "true",
      VITE_AUTH_MODE: "firebase",
    },
  },
});
