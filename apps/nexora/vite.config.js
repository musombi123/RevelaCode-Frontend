import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/dev_nexora/", // Served through the RevelaCode host-level path rewrite.
  server: { host: "0.0.0.0", port: 5173 },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
