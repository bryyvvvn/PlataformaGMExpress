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
      "tea-gel-another-she.trycloudflare.com"
    ],
    proxy: {
      "/api": {
        target: "http//localhost:3000",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
