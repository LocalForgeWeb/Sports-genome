import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { registryConnectionNotice, registryUnavailableExplanation } from "./registryReference";

const panelSource = readFileSync(join(process.cwd(), "client/src/components/StrengthGenomePanel.tsx"), "utf8");

/**
 * An offline research library and a lift that does not qualify both end in "no
 * comparison". Only one of them is a statement about the athlete, and the workspace
 * previously had no way to tell them apart.
 */
describe("registryConnectionNotice", () => {
  it("says nothing while the library is connected", () => {
    expect(registryConnectionNotice({ state: "connected" })).toBeNull();
  });

  it("says nothing before the status has loaded, rather than claiming an outage", () => {
    expect(registryConnectionNotice(undefined)).toBeNull();
    expect(registryConnectionNotice(null)).toBeNull();
  });

  it("reads the same to the athlete whether the cause is configuration or the network", () => {
    const unconfigured = registryConnectionNotice({ state: "unconfigured", missingSettings: ["VITE_SUPABASE_URL"] });
    const unreachable = registryConnectionNotice({ state: "unreachable", detail: "fetch failed" });
    expect(unconfigured).toBe(unreachable);
    expect(unconfigured).toBeTruthy();
  });

  it("does not leak operator detail into athlete-facing copy", () => {
    const notice = registryConnectionNotice({ state: "unconfigured", missingSettings: ["SUPABASE_SERVICE_ROLE_KEY"] });
    expect(notice).not.toContain("SUPABASE");
    expect(notice).not.toContain("_");
  });

  it("clears the athlete of any implication that the outage reflects their training", () => {
    const notice = registryConnectionNotice({ state: "unreachable", detail: "fetch failed" })!;
    expect(notice).toContain("says nothing about your lifts");
  });

  it("stays distinct from the per-lift gate wording", () => {
    const notice = registryConnectionNotice({ state: "unreachable", detail: "x" });
    expect(Object.values(registryUnavailableExplanation)).not.toContain(notice);
  });
});

describe("the workspace surfaces the library's availability", () => {
  it("queries the registry status alongside the reference rows", () => {
    expect(panelSource).toContain("trpc.strengthGenome.referenceRegistryStatus.useQuery");
  });

  it("renders the notice as a status region so it is announced, not just styled", () => {
    expect(panelSource).toContain('role="status"');
    expect(panelSource).toContain("{registryOfflineNotice}");
  });

  it("keeps the notice inside the explanation the athlete opens for this question", () => {
    const disclosure = panelSource.indexOf("How ranks work");
    const notice = panelSource.indexOf("registryOfflineNotice &&");
    expect(disclosure).toBeGreaterThan(-1);
    expect(notice).toBeGreaterThan(disclosure);
  });
});
