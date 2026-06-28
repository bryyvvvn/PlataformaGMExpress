import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  server: {
    allowedHosts: [
      "collide-imaginary-thermos.ngrok-free.dev",
      "exciting-ward-fans-theorem.trycloudflare.com",
    ],
    proxy: {
      "/api": {
        target: "https://plataformagmexpress-production-50b8.up.railway.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
