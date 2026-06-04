import type { User } from "@repo/shared";
import { beforeEach, describe, expect, it } from "vitest";

import { useUserStore } from "./user-store";

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

describe("useUserStore", () => {
  beforeEach(() => {
    useUserStore.getState().clearUser();
  });

  it("starts without an authenticated user", () => {
    const state = useUserStore.getState();

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("stores the current user and marks the session as authenticated", () => {
    useUserStore.getState().setUser(user);

    const state = useUserStore.getState();

    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it("clears the current user and marks the session as unauthenticated", () => {
    useUserStore.getState().setUser(user);

    useUserStore.getState().clearUser();

    const state = useUserStore.getState();

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
