import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

/**
 * One clock zone for every run, whatever the machine's (iOS readiness audit, A12). Fixture tests
 * pin the date with fake timers; the zone has to be pinned too, or a render that reads the
 * runtime zone (the specialization page does) reads differently in Chicago than in CI. Set
 * here, before any worker starts, so every forked worker inherits it. Tests of real zone
 * behaviour pass their zones explicitly (shared/specialization/time.ts takes one everywhere),
 * and a test that needs a runtime zone of its own still sets process.env.TZ itself.
 */
process.env.TZ = "UTC";

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  /**
   * Match how Vite actually builds the app.
   *
   * The React plugin uses the automatic JSX runtime, so components import only
   * the hooks they use and never React itself. Vitest has no React plugin, so it
   * fell back to the classic transform and turned that JSX into
   * `React.createElement` against an identifier the component never imported -
   * any render test touching such a component died on "React is not defined",
   * which reads as a broken component rather than a mismatched transform.
   */
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/**/*.test.ts", "client/**/*.spec.ts", "scripts/higgsfield/**/*.test.ts"],
  },
});
