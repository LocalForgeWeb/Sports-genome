// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * ENV05: only a production build may fall back to the production project. A preview or local
 * build gets a client only when a project is configured explicitly.
 */
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

async function load(deployEnv: string | undefined, env: Record<string, string> = {}) {
  vi.resetModules();
  if (deployEnv !== undefined) vi.stubGlobal("__SG_DEPLOY_ENV__", deployEnv);
  vi.stubEnv("VITE_SUPABASE_URL", env.VITE_SUPABASE_URL ?? "");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
  return import("./supabaseClient");
}

describe("which Supabase project a build may reach", () => {
  it("uses the production project's built-in keys in a production build", async () => {
    const module = await load("production");
    expect(module.deployEnvironment).toBe("production");
    expect(module.supabaseConfigured).toBe(true);
  });

  it("gives a preview no client even though it inherits the production URL", async () => {
    const module = await load("preview", { VITE_SUPABASE_URL: "https://qiccnqkypbhlwpmjcsri.supabase.co" });
    expect(module.supabaseConfigured).toBe(false);
    expect(module.getSupabaseClient()).toBeNull();
  });

  it("gives a local build no client by default", async () => {
    const module = await load(undefined);
    expect(module.deployEnvironment).toBe("local");
    expect(module.supabaseConfigured).toBe(false);
  });

  it("lets an explicitly configured (staging) project through anywhere", async () => {
    const module = await load("preview", { VITE_SUPABASE_URL: "https://staging-ref.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_staging" });
    expect(module.supabaseConfigured).toBe(true);
  });
});
