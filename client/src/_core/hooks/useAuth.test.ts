// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * useAuth used to copy the account row into device storage during render, with no guard.
 * Nothing read the copy, and a browser that blocks site data throws on that write, which
 * took the whole workspace down to the error screen.
 */
const me = vi.hoisted(() => ({ current: undefined as undefined | null | { id: number; name: string } }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { setData: vi.fn(), invalidate: vi.fn() } } }),
    auth: {
      me: { useQuery: () => ({ data: me.current, error: null, isLoading: false, refetch: vi.fn() }) },
      logout: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }) },
    },
  },
}));

import { useAuth } from "./useAuth";

beforeEach(() => { window.localStorage.clear(); me.current = { id: 7, name: "Sam" }; });
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
