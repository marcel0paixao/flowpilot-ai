import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(import.meta.dirname, "src")
      },
      {
        find: /^@\//,
        replacement: `${resolve(import.meta.dirname, "src")}/`
      }
    ]
  },
  server: {
    port: 5173
  }
});
