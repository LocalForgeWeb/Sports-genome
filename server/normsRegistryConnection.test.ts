import { afterEach, describe, expect, it } from "vitest";
import {
  describeRegistryConnection,
  getApprovedNormsReference,
  missingRegistrySettings,
  redactSecrets,
  registrySettingNames,
  resetNormsReferenceCache,
} from "./normsRegistry";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  resetNormsReferenceCache();
});

/**
 * The registry answered every unconfigured deployment the same way it answers a
 * configured one with nothing approved yet: an empty list. Those need very different
 * responses from an operator, so the status has to tell them apart.
 */
describe("missingRegistrySettings", () => {
  it("names both settings when neither is provided", () => {
    expect(missingRegistrySettings({})).toEqual(["VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  });

  it("names only what is actually missing", () => {
    expect(missingRegistrySettings({ VITE_SUPABASE_URL: "https://example.supabase.co" })).toEqual([
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
  });

  it("treats a blank value as missing, because a blank key authenticates nothing", () => {
    expect(missingRegistrySettings({ VITE_SUPABASE_URL: "   ", SUPABASE_SERVICE_ROLE_KEY: "\t" })).toEqual([
      ...registrySettingNames,
    ]);
  });

  it("reports nothing missing once both are set", () => {
    expect(
      missingRegistrySettings({ VITE_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" })
    ).toEqual([]);
  });
});

describe("redactSecrets", () => {
  it("removes a JWT-shaped service key from a quoted request", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.QWxvbmdzaWduYXR1cmVoZXJl";
    const result = redactSecrets(`fetch failed for https://x.supabase.co?apikey=${jwt}`);
    expect(result).not.toContain(jwt);
    expect(result).toContain("[redacted]");
  });

  it("removes a publishable/secret key in the newer sb_ format", () => {
    expect(redactSecrets("401 from sb_secret_abcdefghijklmnop")).toBe("401 from [redacted]");
  });

  it("removes a credential carried in a query string whatever its shape", () => {
    expect(redactSecrets("GET /rest/v1/x?apikey=plaintextvalue&select=*")).toContain("apikey=[redacted]");
  });

  it("leaves an ordinary diagnostic message readable", () => {
    expect(redactSecrets("getaddrinfo ENOTFOUND example.supabase.co")).toBe(
      "getaddrinfo ENOTFOUND example.supabase.co"
    );
  });
});

describe("describeRegistryConnection", () => {
  it("reports unconfigured, with the settings to add, when credentials are absent", () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(describeRegistryConnection()).toEqual({
      state: "unconfigured",
      missingSettings: ["VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    });
  });

  it("reports connected once both settings exist and nothing has failed", () => {
    process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    resetNormsReferenceCache();
    expect(describeRegistryConnection()).toEqual({ state: "connected" });
  });

  it("never returns a settings value, only its name", () => {
    process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const connection = describeRegistryConnection();
    expect(JSON.stringify(connection)).not.toContain("example.supabase.co");
  });
});

describe("a configured backend that refuses the call", () => {
  it("reports unreachable rather than unconfigured, so the key is not blamed for the network", async () => {
    // Port 1 on loopback refuses immediately: the failure path runs without leaving
    // the machine.
    process.env.VITE_SUPABASE_URL = "http://127.0.0.1:1";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    resetNormsReferenceCache();

    // The lookup still yields an empty registry rather than throwing, which is what
    // keeps every observation on an explicit unavailable state.
    await expect(getApprovedNormsReference()).resolves.toEqual([]);

    const connection = describeRegistryConnection();
    expect(connection.state).toBe("unreachable");
    expect(connection).toHaveProperty("detail");
    expect(JSON.stringify(connection)).not.toContain("service-role-key");
  });

  it("clears the failure once a later lookup succeeds", async () => {
    process.env.VITE_SUPABASE_URL = "http://127.0.0.1:1";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    resetNormsReferenceCache();
    await getApprovedNormsReference();
    expect(describeRegistryConnection().state).toBe("unreachable");

    // resetNormsReferenceCache is the seam a redeploy effectively uses.
    resetNormsReferenceCache();
    expect(describeRegistryConnection().state).toBe("connected");
  });
});
