import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { analyticsScriptPlugin } from "./client/vite/analyticsScript";

export default defineConfig({
  plugins: [react(), tailwindcss(), analyticsScriptPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        /**
         * Only dependency-free modules may be split by hand.
         *
         * The lib modules in this app form one cyclic cluster - exerciseCatalog imports
         * exerciseStudyCalibration which imports exerciseCatalog back, and workoutPlanner
         * imports exerciseGenome which imports exerciseCatalog. Cutting a cycle across
         * chunk boundaries makes one chunk evaluate before the chunk it depends on, which
         * surfaces in the browser as "Cannot access 'X' before initialization" and kills
         * the whole dynamic import. Rollup places cyclic modules safely on its own, so
         * everything entangled is left to it.
         *
         * The two researched datasets import nothing at all, so isolating them is safe
         * and keeps roughly 1.25 MB of stable data in its own cacheable chunk.
         */
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/wouter")) return "framework";
          if (id.includes("node_modules/lucide-react")) return "icons";
          if (id.includes("/sportMovementDatabase") || id.includes("/enrichedSportMovementDatabase")) return "movement-data";
        },
      },
    },
  },
  server: {
    host: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
