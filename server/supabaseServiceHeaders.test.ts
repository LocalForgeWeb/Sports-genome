import { describe, expect, it } from "vitest";
import { isJwtApiKey, supabaseServiceHeaders } from "./supabaseServiceHeaders";

/** Shape-accurate stand-ins. Neither is a real key; the point is only the first character run. */
const legacyServiceRole = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.c2lnbmF0dXJl";
const newSecret = "sb_secret_JZQ1x7Kd0pLmNvBqRtYuWi";

describe("Telling the two Supabase key shapes apart", () => {
  it("recognises a legacy service_role key as a JWT", () => {
    expect(isJwtApiKey(legacyServiceRole)).toBe(true);
  });

  it("does not mistake an opaque secret key for a JWT", () => {
    expect(isJwtApiKey(newSecret)).toBe(false);
    expect(isJwtApiKey("sb_publishable_abc123")).toBe(false);
  });

  // Surrounding whitespace survives a copy-paste out of a dashboard more often than it should.
  it("ignores whitespace around the key", () => {
    expect(isJwtApiKey(`  ${legacyServiceRole}\n`)).toBe(true);
  });
});

describe("The headers a server-side read carries", () => {
  it("sends a legacy key in both headers, which is how PostgREST reads the role", () => {
    const headers = supabaseServiceHeaders(legacyServiceRole);
    expect(headers.apikey).toBe(legacyServiceRole);
    expect(headers.Authorization).toBe(`Bearer ${legacyServiceRole}`);
  });

  /**
   * The whole reason this helper exists. A secret key is not a JWT, and Supabase's migration
   * guide says it cannot ride in `Authorization: Bearer` - the gateway translates the `apikey`
   * header into an internal JWT instead. Sending Bearer anyway hands the database a token it
   * cannot parse.
   */
  it("sends an opaque secret key in apikey alone, never as a bearer token", () => {
    const headers = supabaseServiceHeaders(newSecret);
    expect(headers.apikey).toBe(newSecret);
    expect(headers.Authorization).toBeUndefined();
    expect(Object.keys(headers)).not.toContain("Authorization");
  });

  it("trims the key it was handed rather than signing requests with a newline", () => {
    expect(supabaseServiceHeaders(`  ${newSecret}  `).apikey).toBe(newSecret);
  });

  it("carries a caller's extra headers alongside", () => {
    expect(supabaseServiceHeaders(newSecret, { Prefer: "count=exact" }).Prefer).toBe("count=exact");
  });
});
