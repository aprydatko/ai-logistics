import type { User } from "@repo/shared";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/user-store";

import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

const router = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) =>
    React.createElement("a", { href: String(href), ...props }, children),
}));

const user: User = {
  id: "user_1",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  role: "dispatcher",
  isActive: true,
  createdAt: "2026-06-04T10:00:00.000Z",
  updatedAt: "2026-06-04T10:00:00.000Z",
};

afterEach(() => {
  cleanup();
});

describe("LoginForm", () => {
  beforeEach(() => {
    router.refresh.mockClear();
    router.replace.mockClear();
    useUserStore.getState().clearUser();
    vi.unstubAllGlobals();
  });

  it("renders the login fields and submit action", () => {
    render(React.createElement(LoginForm));

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("shows validation messages for empty login values", async () => {
    const currentUser = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(LoginForm));

    await currentUser.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the default login error when authentication fails", async () => {
    const currentUser = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Invalid" }, { status: 401 })),
    );
    render(React.createElement(LoginForm));

    await currentUser.type(screen.getByLabelText("Email"), "alex.morgan@example.com");
    await currentUser.type(screen.getByLabelText("Password"), "password123");
    await currentUser.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Unable to sign in. Check your credentials and try again."),
    ).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
    expect(useUserStore.getState().user).toBeNull();
  });

  it("stores the user and redirects after a successful login", async () => {
    const currentUser = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ user }));
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(LoginForm));

    await currentUser.type(screen.getByLabelText("Email"), "alex.morgan@example.com");
    await currentUser.type(screen.getByLabelText("Password"), "password123");
    await currentUser.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/dashboard");
    });
    expect(router.refresh).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "alex.morgan@example.com",
          password: "password123",
        }),
      }),
    );
    expect(useUserStore.getState().user).toEqual(user);
    expect(useUserStore.getState().isAuthenticated).toBe(true);
  });
});

describe("RegisterForm", () => {
  beforeEach(() => {
    router.refresh.mockClear();
    router.replace.mockClear();
    useUserStore.getState().clearUser();
    vi.unstubAllGlobals();
  });

  it("renders the register fields and submit action", () => {
    render(React.createElement(RegisterForm));

    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows validation messages for empty register values", async () => {
    const currentUser = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(RegisterForm));

    await currentUser.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(await screen.findByText("Last name is required")).toBeInTheDocument();
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the default register error when account creation fails", async () => {
    const currentUser = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Conflict" }, { status: 409 })),
    );
    render(React.createElement(RegisterForm));

    await currentUser.type(screen.getByLabelText("First name"), "Alex");
    await currentUser.type(screen.getByLabelText("Last name"), "Morgan");
    await currentUser.type(screen.getByLabelText("Email"), "alex.morgan@example.com");
    await currentUser.type(screen.getByLabelText("Password"), "password123");
    await currentUser.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Unable to create your account. Check the details and try again."),
    ).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
    expect(useUserStore.getState().user).toBeNull();
  });

  it("stores the user and redirects after a successful registration", async () => {
    const currentUser = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ user }));
    vi.stubGlobal("fetch", fetchMock);
    render(React.createElement(RegisterForm));

    await currentUser.type(screen.getByLabelText("First name"), "Alex");
    await currentUser.type(screen.getByLabelText("Last name"), "Morgan");
    await currentUser.type(screen.getByLabelText("Email"), "alex.morgan@example.com");
    await currentUser.type(screen.getByLabelText("Password"), "password123");
    await currentUser.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/dashboard");
    });
    expect(router.refresh).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          firstName: "Alex",
          lastName: "Morgan",
          email: "alex.morgan@example.com",
          password: "password123",
        }),
      }),
    );
    expect(useUserStore.getState().user).toEqual(user);
    expect(useUserStore.getState().isAuthenticated).toBe(true);
  });
});
