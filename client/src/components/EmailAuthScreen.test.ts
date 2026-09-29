// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  register: vi.fn(),
  passkey: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: mocks.invalidate } } }),
    auth: {
      register: { useMutation: () => ({ mutateAsync: mocks.register, isPending: false }) },
      signIn: { useMutation: () => ({ mutateAsync: mocks.signIn, isPending: false }) },
      passkeyAuthenticationOptions: { useMutation: () => ({ mutateAsync: mocks.passkey, isPending: false }) },
      passkeyAuthenticationVerify: { useMutation: () => ({ mutateAsync: mocks.passkey, isPending: false }) },
      passkeyRegistrationOptions: { useMutation: () => ({ mutateAsync: mocks.passkey, isPending: false }) },
      passkeyRegistrationVerify: { useMutation: () => ({ mutateAsync: mocks.passkey, isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError, success: mocks.toastSuccess } }));

import { EmailAuthScreen } from "./EmailAuthScreen";

function renderScreen() {
  const onAuthenticated = vi.fn();
  const { container } = render(React.createElement(EmailAuthScreen, { onAuthenticated, loading: false }));
  const form = container.querySelector("form");
  if (!form) throw new Error("The sign-in form did not render");
  return { onAuthenticated, form };
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("email sign-in when the request itself fails", () => {
  beforeEach(() => {
    mocks.signIn.mockReset();
    mocks.register.mockReset();
    mocks.toastError.mockReset();
  });

  afterEach(() => { document.body.innerHTML = ""; });

  it("says sign-in could not finish and keeps what the athlete typed", async () => {
    mocks.signIn.mockRejectedValue(new Error("Failed to fetch"));
    const { onAuthenticated, form } = renderScreen();
    fill("Email", "athlete@example.com");
    fill("Password", "correct horse battery");

    fireEvent.submit(form);

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Could not sign in right now. Check your connection and try again."));
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("athlete@example.com");
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("correct horse battery");
  });

  it("says the account could not be created when registration fails", async () => {
    mocks.register.mockRejectedValue(new Error("Failed to fetch"));
    const { onAuthenticated, form } = renderScreen();
    fireEvent.click(screen.getByRole("button", { name: "Need an account? Create one" }));
    fill("Email", "athlete@example.com");
    fill("Password", "a long enough password");
    fill("Confirm password", "a long enough password");

    fireEvent.submit(form);

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Could not create your account right now. Check your connection and try again."));
    expect(mocks.register).toHaveBeenCalledWith({ email: "athlete@example.com", password: "a long enough password" });
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("a long enough password");
  });

  it("asks the athlete to check what they typed when the server refuses the input", async () => {
    mocks.signIn.mockRejectedValue(Object.assign(new Error("Invalid email"), { data: { code: "BAD_REQUEST" } }));
    const { onAuthenticated, form } = renderScreen();
    fill("Email", "athlete@gmail");
    fill("Password", "correct horse battery");

    fireEvent.submit(form);

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Check your email address and password, then try again."));
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("athlete@gmail");
  });

  it("still names a wrong password when the server answers", async () => {
    mocks.signIn.mockResolvedValue({ ok: false, code: "INVALID_CREDENTIALS" });
    const { onAuthenticated, form } = renderScreen();
    fill("Email", "athlete@example.com");
    fill("Password", "not my password");

    fireEvent.submit(form);

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Email or password is incorrect"));
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
