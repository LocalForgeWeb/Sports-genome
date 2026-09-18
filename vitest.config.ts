import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

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
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/**/*.test.ts", "client/**/*.spec.ts"],
  },
});
