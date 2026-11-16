import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // In development, `npm run api` serves /api/mark on port 8787.
    proxy: { "/api": "http://localhost:8787" },
  },
  test: {
    environment: "node",
  },
});
