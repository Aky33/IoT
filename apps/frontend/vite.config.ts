import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_DEV_PROXY_TARGET || env.VITE_API_BASE_URL || "http://localhost:3000";
  const previewAllowedHosts = [
    "localhost",
    "127.0.0.1",
    ".code.run",
    "web--iot-frontend--pmt59zspsmn5.code.run",
  ];

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        "/api": backend,
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      allowedHosts: previewAllowedHosts,
    },
  };
});
