import { describe, expect, it } from "vitest";
import viteConfig from "../../vite.config";

/**
 * Manual chunking over a cyclic module graph is a production-only footgun: the dev
 * server never splits, so the failure appears for the first time in a deployed build
 * as "Cannot access 'X' before initialization", which rejects the dynamic import and
 * leaves the boot screen covering a working app.
 *
 * These lib modules import each other - exerciseCatalog <-> exerciseStudyCalibration,
 * workoutPlanner -> exerciseGenome -> exerciseCatalog - so none of them may be pinned
 * to a hand-written chunk. Rollup keeps cyclic modules together on its own.
 */
const entangled = [
  "/home/app/client/src/lib/exerciseCatalog.ts",
  "/home/app/client/src/lib/exerciseCatalogExpansion.ts",
  "/home/app/client/src/lib/exerciseStudyCalibration.ts",
  "/home/app/client/src/lib/workoutPlanner.ts",
  "/home/app/client/src/lib/exerciseGenome.ts",
  "/home/app/client/src/lib/movementRecommendations.ts",
  "/home/app/client/src/lib/movementProgramAnalysis.ts",
  "/home/app/client/src/components/ExerciseGenomePanel.tsx",
];

/** Dependency-free datasets: safe to isolate, and the reason the split exists at all. */
const leafDatasets = [
  "/home/app/client/src/lib/sportMovementDatabase.ts",
  "/home/app/client/src/lib/enrichedSportMovementDatabase.ts",
];

function manualChunks() {
  const output = (viteConfig as { build?: { rollupOptions?: { output?: { manualChunks?: (id: string) => string | undefined } } } }).build
    ?.rollupOptions?.output;
  const fn = output?.manualChunks;
  expect(typeof fn, "vite config exposes a manualChunks function").toBe("function");
  return fn!;
}

describe("manual chunking never cuts a module cycle", () => {
  it("leaves every entangled lib module to Rollup", () => {
    const assign = manualChunks();
    for (const id of entangled) {
      expect(assign(id), `${id.split("/").pop()} must not be pinned to a manual chunk`).toBeUndefined();
    }
  });

  it("still isolates the dependency-free datasets", () => {
    const assign = manualChunks();
    for (const id of leafDatasets) {
      expect(assign(id), `${id.split("/").pop()} stays cacheable on its own`).toBe("movement-data");
    }
  });

  it("keeps framework and icons split, which app code only ever imports one way", () => {
    const assign = manualChunks();
    expect(assign("/home/app/node_modules/react/index.js")).toBe("framework");
    expect(assign("/home/app/node_modules/wouter/index.js")).toBe("framework");
    expect(assign("/home/app/node_modules/lucide-react/dist/esm/lucide-react.js")).toBe("icons");
  });
});
