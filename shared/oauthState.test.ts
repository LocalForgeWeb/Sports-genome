import { describe, expect, it } from "vitest";
import { decodeOAuthState, encodeOAuthState } from "./const";

describe("OAuth state encoding", () => {
  it("round-trips a native login state", () => {
    const state = encodeOAuthState({
      redirectUri: "https://api.example.com/api/oauth/callback",
      nonce: "nonce-123",
      native: true,
    });

    expect(decodeOAuthState(state)).toEqual({
      redirectUri: "https://api.example.com/api/oauth/callback",
      nonce: "nonce-123",
      native: true,
    });
  });

  it("reports web logins as non-native", () => {
    const state = encodeOAuthState({
      redirectUri: "https://app.example.com/api/oauth/callback",
      nonce: "nonce-123",
    });

    expect(decodeOAuthState(state).native).toBe(false);
  });

  it("coerces a truthy non-boolean `native` to false", () => {
    // `state` is attacker-controllable and the server branches on this flag, so
    // only a literal `true` may enable the native path.
    const forged = btoa(JSON.stringify({ redirectUri: "https://x.test", nonce: "n", native: "yes" }));

    expect(decodeOAuthState(forged).native).toBe(false);
  });

  it("drops a non-string nonce so the CSRF guard rejects it", () => {
    const forged = btoa(JSON.stringify({ redirectUri: "https://x.test", nonce: { toString: 1 } }));

    expect(decodeOAuthState(forged).nonce).toBeUndefined();
  });

  it("returns an empty redirect for malformed base64 rather than throwing", () => {
    expect(decodeOAuthState("!!!not-base64!!!")).toEqual({ redirectUri: "" });
  });

  it("still parses legacy bare-redirectUri state", () => {
    const legacy = btoa("https://app.example.com/api/oauth/callback");

    expect(decodeOAuthState(legacy)).toEqual({
      redirectUri: "https://app.example.com/api/oauth/callback",
    });
  });
});
