// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * useAuth used to copy the account row into device storage during render, with no guard.
 * Nothing read the copy, and a browser that blocks site data throws on that write, which
 * took the whole workspace down to the error screen.
 */
const me = vi.hoisted(() => ({ current: undefined as undefined | null | { id: number; name: string } }));
const setMe = vi.hoisted(() => ({ calls: [] as unknown[][] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { setData: (...args: unknown[]) => { setMe.calls.push(args); }, invalidate: vi.fn() } } }),
    auth: {
      me: { useQuery: () => ({ data: me.current, error: null, isLoading: false, refetch: vi.fn() }) },
      logout: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }) },
    },
  },
}));

import { useAuth } from "./useAuth";

beforeEach(() => { window.localStorage.clear(); me.current = { id: 7, name: "Sam" }; setMe.calls = []; });
afterEach(() => { vi.restoreAllMocks(); });

describe("useAuth and device storage", () => {
  it("still renders the signed-in athlete when the browser refuses storage writes", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("denied", "SecurityError"); });
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toEqual({ id: 7, name: "Sam" });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("keeps no copy of the account row on the device", () => {
    renderHook(() => useAuth());
    expect(window.localStorage.getItem("sports-genome-user-info")).toBeNull();
  });

  it("clears a copy an earlier build left behind", () => {
    window.localStorage.setItem("sports-genome-user-info", JSON.stringify({ id: 7, name: "Sam" }));
    renderHook(() => useAuth());
    expect(window.localStorage.getItem("sports-genome-user-info")).toBeNull();
  });
});

/**
 * The sign-in notice (lib/sessionNotice.ts) reads auth.me from the query cache: a refusal is
 * a lapse only while it holds an account. Signing out has to leave it answering null, so a
 * refusal afterwards is not called one (Sep 28 regression brief §7).
 */
describe("useAuth and the sign-in notice", () => {
  it("leaves auth.me answering null after the athlete signs out", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.logout(); });
    expect(setMe.calls.at(-1)).toEqual([undefined, null]);
  });
});
