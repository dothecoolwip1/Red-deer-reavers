import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served at reddeerreavers.com/app/ and, through a host rewrite in vercel.json, at app.reddeerreavers.com.
export default defineConfig({
  base: "/app/",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  test: { environment: "node" }
} as never);
