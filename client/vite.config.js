import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules[\\/](firebase|@firebase)[\\/]/.test(id)) {
            return "firebase";
          }

          if (
            /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(
              id,
            )
          ) {
            return "react-vendor";
          }

          if (/node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/.test(id)) {
            return "forms-vendor";
          }

          if (/node_modules[\\/](@tanstack|axios|sonner|date-fns)[\\/]/.test(id)) {
            return "data-vendor";
          }

          return undefined;
        },
      },
    },
  },
});
