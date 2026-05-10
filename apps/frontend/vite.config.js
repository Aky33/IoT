import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/auth": "http://localhost:3000",
            "/users": "http://localhost:3000",
            "/caregivers": "http://localhost:3000",
            "/devices": "http://localhost:3000",
            "/notifications": "http://localhost:3000",
            "/invitations": "http://localhost:3000",
            "/push": "http://localhost:3000",
            "/health": "http://localhost:3000",
        },
    },
});
