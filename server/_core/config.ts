/**
 * Server configuration by NAME only (Infrastructure V2, ENV03/ENV04). Values are never
 * returned, logged or compared outside the code that uses them.
 *
 * Classes:
 * - required: production cannot do its job without it (the evidence library, ranks, shares).
 * - optional: a feature that reports itself unavailable when absent, never a demo mode.
 * - local-only: honoured outside production; ignored in it.
 */
export type ConfigClass = "required" | "optional" | "local-only";

export const SERVER_CONFIG: ReadonlyArray<{ name: string; class: ConfigClass; secret: boolean; purpose: string }> = [
  { name: "VITE_SUPABASE_URL", class: "required", secret: false, purpose: "Supabase project the server reads and writes (public value)." },
  { name: "SUPABASE_SERVICE_ROLE_KEY", class: "required", secret: true, purpose: "Server-only Supabase key: evidence library, ranks, shares, shared rate limits." },
  { name: "DATABASE_URL", class: "optional", secret: true, purpose: "MySQL for account sign-in and account workout logs; absent = account routes report unavailable." },
  { name: "HEALTH_CHECK_TOKEN", class: "optional", secret: true, purpose: "Unlocks /api/health/ready for the owner's monitor." },
  { name: "RATE_LIMIT_SHARED", class: "optional", secret: false, purpose: "\"off\" turns the cross-instance rate limit off (the per-instance limit stays)." },
  { name: "SHARE_STORE", class: "local-only", secret: false, purpose: "\"memory\" keeps shares in memory for local runs; ignored in production." },
];

/** Which names are set, by class - never their values. */
export function configSummary(env: NodeJS.ProcessEnv = process.env) {
  const present = (name: string) => Boolean(env[name]?.trim());
  return {
    missingRequired: SERVER_CONFIG.filter((item) => item.class === "required" && !present(item.name)).map((item) => item.name),
    optionalSet: SERVER_CONFIG.filter((item) => item.class === "optional" && present(item.name)).map((item) => item.name),
  };
}

let warned = false;
/**
 * Says once per instance, in the log, which required names are missing - so a misconfigured
 * deployment is diagnosable from its first request instead of from a user's report. It does
 * not stop the instance: every feature already reports itself unavailable without its config,
 * and a public page that cannot reach the evidence library is still a working app.
 */
export function warnOnMissingConfig(env: NodeJS.ProcessEnv = process.env): void {
  if (warned || env.NODE_ENV !== "production") return;
  warned = true;
  const { missingRequired } = configSummary(env);
  if (missingRequired.length) console.warn(JSON.stringify({ event: "config_missing", missing: missingRequired, environment: env.VERCEL_ENV ?? null }));
}
