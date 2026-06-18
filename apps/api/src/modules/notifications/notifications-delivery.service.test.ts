import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationsDeliveryService } from "./notifications-delivery.service";
import type { NotificationDeliveryInput } from "./notifications.types";

const buildInput = (
  overrides: Partial<NotificationDeliveryInput> = {},
): NotificationDeliveryInput => {
  const now = new Date("2026-06-17T10:00:00.000Z");
  return {
    channels: ["email"],
    notification: {
      id: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      category: "incidents",
      type: "incident_created",
      channels: ["email"],
      title: "New incident",
      message: "An incident was reported.",
      entityType: "incident",
      entityId: "33333333-3333-4333-8333-333333333333",
      href: "/incidents/33333333-3333-4333-8333-333333333333",
      readAt: null,
      payload: { incidentId: "33333333-3333-4333-8333-333333333333" },
      createdAt: "2026-06-17T10:00:00.000Z",
      updatedAt: "2026-06-17T10:00:00.000Z",
    },
    preference: {
      id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      userId: "22222222-2222-4222-8222-222222222222",
      emailFrequency: "instant",
      ai: { emailEnabled: true, inAppEnabled: true },
      documents: { emailEnabled: true, inAppEnabled: true },
      drivers: { emailEnabled: true, inAppEnabled: true },
      incidents: { emailEnabled: true, inAppEnabled: true },
      loads: { emailEnabled: true, inAppEnabled: true },
      system: { emailEnabled: true, inAppEnabled: true },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    recipient: {
      email: "u@example.com",
      firstName: "U",
      id: "22222222-2222-4222-8222-222222222222",
      lastName: "Ser",
    },
    ...overrides,
  };
};

describe("NotificationsDeliveryService", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("escapes HTML in message and href to prevent injection", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as never;

    const service = new NotificationsDeliveryService({
      get: (key: string) =>
        key === "RESEND_API_KEY" ? "k" : "noreply@example.com",
    } as never);

    await service.sendNotificationEmail(
      buildInput({
        notification: {
          ...buildInput().notification,
          message: 'Hello <script>alert("xss")</script>',
          href: 'https://example.com/?q="><img src=x>',
        },
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string,
    );
    expect(body.html).not.toContain("<script>");
    expect(body.html).toContain("&lt;script&gt;");
    expect(body.html).toContain("&quot;");
    expect(body.html).not.toContain('"><img');
  });

  it("skips sending when email channel is not in the input channels list", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as never;

    const service = new NotificationsDeliveryService({
      get: () => "anything",
    } as never);

    await service.sendNotificationEmail(buildInput({ channels: ["in_app"] }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips sending when email frequency is not instant", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as never;

    const service = new NotificationsDeliveryService({
      get: () => "anything",
    } as never);

    await service.sendNotificationEmail(
      buildInput({
        preference: {
          ...buildInput().preference,
          emailFrequency: "daily",
        },
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips sending when email address is invalid", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as never;

    const service = new NotificationsDeliveryService({
      get: () => "anything",
    } as never);

    await service.sendNotificationEmail(
      buildInput({
        recipient: {
          ...buildInput().recipient,
          email: "invalid-email",
        },
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries on failure with exponential backoff", async () => {
    let attemptCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: () => "Server Error",
        });
      }
      return Promise.resolve({ ok: true });
    });
    global.fetch = fetchMock as never;

    const service = new NotificationsDeliveryService({
      get: (key: string) =>
        key === "RESEND_API_KEY" ? "k" : "noreply@example.com",
    } as never);

    await service.sendNotificationEmail(buildInput());

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("uses environment configuration for retry settings", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, text: () => "Error" });
    global.fetch = fetchMock as never;

    const service = new NotificationsDeliveryService({
      get: (key: string) => {
        const config: Record<string, unknown> = {
          RESEND_API_KEY: "k",
          RESEND_FROM_EMAIL: "noreply@example.com",
          EMAIL_RETRY_MAX_ATTEMPTS: 2,
          EMAIL_RETRY_INITIAL_DELAY_MS: 500,
        };
        return config[key];
      },
    } as never);

    await expect(service.sendNotificationEmail(buildInput())).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("skips sending when email configuration is missing", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as never;

    const service = new NotificationsDeliveryService({
      get: () => undefined,
    } as never);

    await service.sendNotificationEmail(buildInput());

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
