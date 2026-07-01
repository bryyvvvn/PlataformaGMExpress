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
      "industry-terrorists-achieve-probability.trycloudflare.com"
    ],
    proxy: {
      "/api": {
        target: "admin.gmexpress.cl",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
