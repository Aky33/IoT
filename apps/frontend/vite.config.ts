import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backend = "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/auth/": backend,
      "/users/": backend,
      "/caregivers/": backend,
      "/devices/": backend,
      "/notifications/stream": { target: backend, headers: { Connection: "keep-alive" } },
      "/notifications/": backend,
      "/invitations/": backend,
      "/push/": backend,
      "/health": backend,
    },
  },
});
