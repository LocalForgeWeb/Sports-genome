import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionNotice, sessionNoticeId, type SessionNoticeToast } from "@/lib/sessionNotice";

/**
 * Sep 28 regression brief §7. The notice fired on any UNAUTHORIZED answer, held back only by a
 * 60 s window: a device-store athlete who had never signed in was told their sign-in had
 * "expired" on every About me visit, refocus and reload after the minute was up.
 */
const refused = { data: { code: "UNAUTHORIZED" } };
const authMe = [["auth", "me"], { type: "query" }];

function setup(user: unknown) {
  const client = new QueryClient();
  client.setQueryData(authMe, user);
  const notify = { show: vi.fn(), dismiss: vi.fn() } satisfies SessionNoticeToast;
  const notice = createSessionNotice(client, notify);
  return { client, notify, notice };
}

describe("the sign-in notice", () => {
  const disposers: (() => void)[] = [];
  afterEach(() => { disposers.splice(0).forEach((dispose) => dispose()); });

  it("says nothing on the device store, where no one is signed in", () => {
    const { notify, notice } = setup(null);
    disposers.push(notice.dispose);
    notice.onError(refused);
    notice.onError(refused);
    expect(notify.show).not.toHaveBeenCalled();
    expect(notice.isLapsed()).toBe(false);
  });

  it("says it once when a signed-in session is refused, with a close button and one action", () => {
    const { notify, notice } = setup({ id: 7 });
    disposers.push(notice.dispose);
    // A query, its refetch on focus, and a mutation, all refused in the same lapse.
    notice.onError(refused);
    notice.onError(refused);
    notice.onError(refused);
    expect(notify.show).toHaveBeenCalledTimes(1);
    const [, options] = notify.show.mock.calls[0];
    expect(options.id).toBe(sessionNoticeId);
    expect(options.closeButton).toBe(true);
    expect(options.action.label).toMatch(/^(Sign in|Account & sync)$/);
    expect(notice.isLapsed()).toBe(true);
  });

  it("ignores every other failure", () => {
    const { notify, notice } = setup({ id: 7 });
    disposers.push(notice.dispose);
    notice.onError({ data: { code: "INTERNAL_SERVER_ERROR" } });
    notice.onError(new Error("offline"));
    notice.onError(null);
    expect(notify.show).not.toHaveBeenCalled();
  });

  it("clears when auth.me answers with a user again, and a later lapse is said once more", () => {
    const { client, notify, notice } = setup({ id: 7 });
    disposers.push(notice.dispose);
    const changes = vi.fn();
    notice.subscribe(changes);
    notice.onError(refused);
    // Still signed out: auth.me answering null does not clear it.
    client.setQueryData(authMe, null);
    expect(notice.isLapsed()).toBe(true);
    client.setQueryData(authMe, { id: 7 });
    expect(notice.isLapsed()).toBe(false);
    expect(notify.dismiss).toHaveBeenCalledWith(sessionNoticeId);
    expect(changes).toHaveBeenCalledTimes(2);
    notice.onError(refused);
    expect(notify.show).toHaveBeenCalledTimes(2);
  });

  it("does not restore the notice from a disposed listener", () => {
    const { client, notify, notice } = setup({ id: 7 });
    notice.onError(refused);
    notice.dispose();
    client.setQueryData(authMe, { id: 7 });
    expect(notify.dismiss).not.toHaveBeenCalled();
  });

  it("opens Account & sync through whatever Home registered", () => {
    const { notify, notice } = setup({ id: 7 });
    disposers.push(notice.dispose);
    const open = vi.fn();
    notice.setOpenAccount(open);
    notice.onError(refused);
    const [, options] = notify.show.mock.calls[0];
    if (options.action.label === "Account & sync") {
      options.action.onClick();
      expect(open).toHaveBeenCalledTimes(1);
    }
  });
});
