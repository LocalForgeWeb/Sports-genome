import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyticsScriptPlugin, resolveAnalyticsTag } from "./analyticsScript";

const indexHtml = readFileSync(join(process.cwd(), "client/index.html"), "utf8");

/**
 * Production shipped the scaffold's unconfigured analytics tag, so every page load
 * fetched a literal `%VITE_ANALYTICS_ENDPOINT%` path and took a 404 before the app
 * had rendered anything.
 */
describe("the analytics tag only ships when it is configured", () => {
  const configured = {
    VITE_ANALYTICS_ENDPOINT: "https://analytics.example.com",
    VITE_ANALYTICS_WEBSITE_ID: "abc-123",
  };

  it("removes the tag from the real index.html when nothing is configured", () => {
    // Pinned against the shipped document rather than a fixture: a reworded tag that
    // slipped past the pattern would fail here instead of in production.
    expect(indexHtml).toContain("%VITE_ANALYTICS_ENDPOINT%");
    const result = resolveAnalyticsTag(indexHtml, {});
    expect(result).not.toContain("%VITE_ANALYTICS_ENDPOINT%");
    expect(result).not.toContain("%VITE_ANALYTICS_WEBSITE_ID%");
  });

  it("leaves the rest of the document untouched", () => {
    const result = resolveAnalyticsTag(indexHtml, {});
    expect(result).toContain('<div id="root"></div>');
    expect(result).toContain("sports-genome-boot-splash");
    expect(result).toContain("</body>");
    // Only the one tag is removed.
    expect(indexHtml.length - result.length).toBeLessThan(200);
  });

  it("keeps the tag once both values are present", () => {
    expect(resolveAnalyticsTag(indexHtml, configured)).toBe(indexHtml);
  });

  it("drops the tag when only half the configuration exists", () => {
    // An endpoint with no website id still produces a request the collector rejects.
    for (const env of [
      { VITE_ANALYTICS_ENDPOINT: configured.VITE_ANALYTICS_ENDPOINT },
      { VITE_ANALYTICS_WEBSITE_ID: configured.VITE_ANALYTICS_WEBSITE_ID },
      { VITE_ANALYTICS_ENDPOINT: "   ", VITE_ANALYTICS_WEBSITE_ID: "   " },
    ]) {
      expect(resolveAnalyticsTag(indexHtml, env)).not.toContain("%VITE_ANALYTICS_ENDPOINT%");
    }
  });
});

describe("the plugin is wired into the build", () => {
  it("transforms the document before Vite substitutes placeholders", () => {
    const plugin = analyticsScriptPlugin();
    expect(plugin.transformIndexHtml.order).toBe("pre");
    plugin.configResolved({ env: {} });
    expect(plugin.transformIndexHtml.handler(indexHtml)).not.toContain("%VITE_ANALYTICS_ENDPOINT%");
  });

  it("reads configuration from the resolved Vite env, not process.env", () => {
    // envDir points at the repo root; config.env is what actually reached the build.
    const plugin = analyticsScriptPlugin();
    plugin.configResolved({ env: { VITE_ANALYTICS_ENDPOINT: "https://a.example", VITE_ANALYTICS_WEBSITE_ID: "id" } });
    expect(plugin.transformIndexHtml.handler(indexHtml)).toContain("%VITE_ANALYTICS_ENDPOINT%");
  });

  it("is registered in the vite config", () => {
    const config = readFileSync(join(process.cwd(), "vite.config.ts"), "utf8");
    expect(config).toContain("analyticsScriptPlugin()");
  });
});
