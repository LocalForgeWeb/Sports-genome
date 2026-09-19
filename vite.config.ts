import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { analyticsScriptPlugin } from "./client/vite/analyticsScript";
import { preloadWorkspaceChunkPlugin } from "./client/vite/preloadWorkspaceChunk";
import { execSync } from "node:child_process";

/** The commit this bundle was built from, and when. */
function buildStamp() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA
    || (() => { try { return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(); } catch { return "unknown"; } })();
  return { commit: sha.slice(0, 7), builtAt: new Date().toISOString() };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), analyticsScriptPlugin(), preloadWorkspaceChunkPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  /**
   * Stamp the build into the bundle.
   *
   * "I am not seeing my changes" has no answer from the outside: the deployment
   * is current, the bundle is byte-identical to the build, and the only place
   * the question can actually be settled is the device in front of you. Vercel
   * keeps every past deployment at its own permanent URL, so a bookmark or a
   * home-screen icon saved from one of those never updates however many times
   * the alias moves - and nothing on screen says which build you are looking at.
   *
   * VERCEL_GIT_COMMIT_SHA is set during a Vercel build; a local build falls back
   * to the working tree's own commit.
   */
  define: {
    __SG_BUILD__: JSON.stringify(buildStamp()),
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
