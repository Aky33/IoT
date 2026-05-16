import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "");
    var backend = env.VITE_DEV_PROXY_TARGET || env.VITE_API_BASE_URL || "http://localhost:3000";
    return {
        plugins: [react()],
        server: {
            port: 5174,
            proxy: {
                "/auth/": backend,
                "/users/": backend,
                "/caregivers/": backend,
                "/devices/all": backend,
                "/devices/create": backend,
                "/devices/get/": backend,
                "/devices/edit/": backend,
                "/devices/delete/": backend,
                "/devices/simulate/": backend,
                "/notifications/stream": { target: backend, headers: { Connection: "keep-alive" } },
                "/notifications/": backend,
                "/invitations/": backend,
                "/push/": backend,
                "/health": backend,
            },
        },
    };
});
