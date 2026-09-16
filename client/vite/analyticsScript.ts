/**
 * The analytics tag arrived with the project scaffold and was never configured. Vite
 * only substitutes `%VITE_*%` placeholders in index.html for variables that are
 * actually defined; undefined ones are left verbatim, so every production page load
 * requested `/%VITE_ANALYTICS_ENDPOINT%/umami` and took a 404 on the way in.
 *
 * Rather than hardcode an endpoint the app does not have, the tag is emitted only when
 * both values are configured and dropped entirely otherwise.
 */

const analyticsTagPattern = /[ \t]*<script[^>]*%VITE_ANALYTICS_ENDPOINT%[^>]*><\/script>\n?/g;

export function resolveAnalyticsTag(html: string, env: Record<string, string | undefined>): string {
  const endpoint = (env.VITE_ANALYTICS_ENDPOINT ?? "").trim();
  const websiteId = (env.VITE_ANALYTICS_WEBSITE_ID ?? "").trim();

  // A configured endpoint without an id, or the reverse, still produces a request the
  // collector rejects, so both have to be present before the tag ships.
  if (endpoint && websiteId) return html;
  return html.replace(analyticsTagPattern, "");
}

export function analyticsScriptPlugin() {
  let env: Record<string, string | undefined> = {};
  return {
    name: "sports-genome-analytics-script",
    configResolved(config: { env: Record<string, string | undefined> }) {
      env = config.env ?? {};
    },
    transformIndexHtml: {
      // Runs ahead of Vite's own placeholder substitution, so the tag is gone before
      // there is anything to warn about.
      order: "pre" as const,
      handler(html: string) {
        return resolveAnalyticsTag(html, env);
      },
    },
  };
}
