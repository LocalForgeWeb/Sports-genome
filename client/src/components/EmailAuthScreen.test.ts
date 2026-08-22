import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn() } } }),
    auth: {
      register: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      signIn: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeyAuthenticationOptions: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeyAuthenticationVerify: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeyRegistrationOptions: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeyRegistrationVerify: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { EmailAuthScreen } from "./EmailAuthScreen";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("standalone Gym Optimizer auth screen", () => {
  it("renders independent email sign-in and registration access without a Manus provider entry", () => {
    const markup = renderToStaticMarkup(createElement(EmailAuthScreen, { loading: false, onAuthenticated: vi.fn() }));
    expect(markup).toContain("Sign in with email");
    expect(markup).toContain("Need an account? Create one");
    expect(markup).toContain("Gym Optimizer email account");
    expect(markup).not.toMatch(/sign in with manus|manus oauth|continue with manus/i);
  });
});
