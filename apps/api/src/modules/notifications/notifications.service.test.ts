import { describe, expect, it, vi } from "vitest";

import { NotificationsService } from "./notifications.service";

const makeSelectChain = (result: unknown) => {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    then: (
      resolve: (value: unknown) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain;
};

type PreferenceFixture = {
  id: string;
  userId: string;
  emailFrequency: "off" | "instant" | "daily";
  aiInAppEnabled: boolean;
  aiEmailEnabled: boolean;
  documentsInAppEnabled: boolean;
  documentsEmailEnabled: boolean;
  driversInAppEnabled: boolean;
  driversEmailEnabled: boolean;
  incidentsInAppEnabled: boolean;
  incidentsEmailEnabled: boolean;
  loadsInAppEnabled: boolean;
  loadsEmailEnabled: boolean;
  systemInAppEnabled: boolean;
  systemEmailEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const buildPreference = (
  overrides: Partial<PreferenceFixture> = {},
): PreferenceFixture => ({
  id: "33333333-3333-4333-8333-333333333333",
  userId: "22222222-2222-4222-8222-222222222222",
  emailFrequency: "off",
  aiEmailEnabled: false,
  aiInAppEnabled: true,
  documentsEmailEnabled: false,
  documentsInAppEnabled: true,
  driversEmailEnabled: false,
  driversInAppEnabled: true,
  incidentsEmailEnabled: false,
  incidentsInAppEnabled: true,
  loadsEmailEnabled: false,
  loadsInAppEnabled: true,
  systemEmailEnabled: false,
  systemInAppEnabled: false,
  createdAt: new Date("2026-06-17T10:00:00.000Z"),
  updatedAt: new Date("2026-06-17T10:00:00.000Z"),
  ...overrides,
});

const buildService = (deps: {
  client: unknown;
  gateway?: unknown;
  delivery?: unknown;
  queue?: unknown;
}): NotificationsService =>
  new NotificationsService(
    { client: deps.client } as never,
    (deps.gateway ?? {
      emitDashboardIncidentStatsUpdated: vi.fn(),
      emitNotificationCreated: vi.fn(),
      emitNotificationRead: vi.fn(),
      emitUnreadCountUpdated: vi.fn(),
    }) as never,
    (deps.delivery ?? { sendNotificationEmail: vi.fn() }) as never,
    (deps.queue ?? { add: vi.fn() }) as never,
  );

describe("NotificationsService", () => {
  it("maps notifications to API payload", async () => {
    const now = new Date("2026-06-17T10:00:00.000Z");
    const rows = makeSelectChain([
      {
        id: "11111111-1111-4111-8111-111111111111",
        userId: "22222222-2222-4222-8222-222222222222",
        category: "incidents",
        type: "incident_created",
        channels: ["in_app"],
        title: "New incident reported",
        message: "Incident created.",
        entityType: "incident",
        entityId: "33333333-3333-4333-8333-333333333333",
        href: "/incidents/33333333-3333-4333-8333-333333333333",
        readAt: null,
        payload: {
          incidentId: "33333333-3333-4333-8333-333333333333",
        },
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const client = {
      select: vi.fn().mockReturnValue(rows),
    };
    const service = new NotificationsService(
      { client } as never,
      {
        emitNotificationCreated: vi.fn(),
        emitNotificationRead: vi.fn(),
        emitUnreadCountUpdated: vi.fn(),
        emitDashboardIncidentStatsUpdated: vi.fn(),
      } as never,
      { sendNotificationEmail: vi.fn() } as never,
      { add: vi.fn() } as never,
    );

    await expect(
      service.listForUser("22222222-2222-4222-8222-222222222222"),
    ).resolves.toEqual({
      success: true,
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          userId: "22222222-2222-4222-8222-222222222222",
          category: "incidents",
          type: "incident_created",
          channels: ["in_app"],
          title: "New incident reported",
          message: "Incident created.",
          entityType: "incident",
          entityId: "33333333-3333-4333-8333-333333333333",
          href: "/incidents/33333333-3333-4333-8333-333333333333",
          readAt: null,
          payload: {
            incidentId: "33333333-3333-4333-8333-333333333333",
          },
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ],
    });
  });

  it("creates document completion notifications for the uploader", async () => {
    const now = new Date("2026-06-17T10:00:00.000Z");
    const recipient = {
      email: "manager@example.com",
      firstName: "Mia",
      id: "22222222-2222-4222-8222-222222222222",
      lastName: "Manager",
    };
    const preferenceRecord = {
      id: "33333333-3333-4333-8333-333333333333",
      userId: recipient.id,
      emailFrequency: "off",
      aiEmailEnabled: false,
      aiInAppEnabled: true,
      documentsEmailEnabled: false,
      documentsInAppEnabled: false,
      driversEmailEnabled: false,
      driversInAppEnabled: true,
      incidentsEmailEnabled: false,
      incidentsInAppEnabled: true,
      loadsEmailEnabled: false,
      loadsInAppEnabled: true,
      systemEmailEnabled: false,
      systemInAppEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
    const createdNotification = {
      id: "44444444-4444-4444-8444-444444444444",
      userId: recipient.id,
      category: "documents",
      type: "system",
      channels: ["in_app"],
      title: "Document ready for review",
      message: "rate-confirmation.pdf has extracted fields ready for review.",
      entityType: null,
      entityId: "55555555-5555-4555-8555-555555555555",
      href: "/documents/55555555-5555-4555-8555-555555555555",
      readAt: null,
      payload: {
        href: "/documents/55555555-5555-4555-8555-555555555555",
        title: "rate-confirmation.pdf",
      },
      createdAt: now,
      updatedAt: now,
    };
    const recipientRows = makeSelectChain([recipient]);
    const preferenceRows = makeSelectChain([preferenceRecord]);
    const unreadRows = makeSelectChain([{ unreadCount: 1 }]);
    const insertReturning = vi.fn().mockResolvedValue([createdNotification]);
    const insertValues = vi.fn().mockReturnValue({
      returning: insertReturning,
    });
    const updateReturning = vi.fn().mockResolvedValue([
      {
        ...preferenceRecord,
        documentsInAppEnabled: true,
        updatedAt: new Date("2026-06-17T10:05:00.000Z"),
      },
    ]);
    const updateWhere = vi.fn().mockReturnValue({
      returning: updateReturning,
    });
    const updateSet = vi.fn().mockReturnValue({
      where: updateWhere,
    });
    const client = {
      insert: vi.fn().mockReturnValue({ values: insertValues }),
      update: vi.fn().mockReturnValue({ set: updateSet }),
      select: vi
        .fn()
        .mockReturnValueOnce(recipientRows)
        .mockReturnValueOnce(preferenceRows)
        .mockReturnValueOnce(unreadRows),
    };
    const gateway = {
      emitDashboardIncidentStatsUpdated: vi.fn(),
      emitNotificationCreated: vi.fn(),
      emitNotificationRead: vi.fn(),
      emitUnreadCountUpdated: vi.fn(),
    };
    const service = new NotificationsService(
      { client } as never,
      gateway as never,
      { sendNotificationEmail: vi.fn() } as never,
      { add: vi.fn() } as never,
    );

    await expect(
      service.createDocumentProcessingNotifications({
        documentId: "55555555-5555-4555-8555-555555555555",
        fileName: "rate-confirmation.pdf",
        status: "needs_review",
        uploadedByUserId: recipient.id,
      }),
    ).resolves.toBeUndefined();

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "documents",
        channels: ["in_app"],
        entityId: "55555555-5555-4555-8555-555555555555",
        href: "/documents/55555555-5555-4555-8555-555555555555",
        message: "rate-confirmation.pdf has extracted fields ready for review.",
        title: "Document ready for review",
        type: "system",
        userId: recipient.id,
      }),
    );
    expect(gateway.emitNotificationCreated).toHaveBeenCalledWith(
      recipient.id,
      expect.objectContaining({
        category: "documents",
        id: createdNotification.id,
      }),
    );
    expect(gateway.emitUnreadCountUpdated).toHaveBeenCalledWith(
      recipient.id,
      1,
    );
  });

  it("upgrades legacy document preferences on first read", async () => {
    // A legacy row: documents disabled, everything else at the original
    // defaults, frequency = off — must be upgraded to documentsInAppEnabled=true.
    const legacyPreference = buildPreference({
      documentsInAppEnabled: false,
      documentsEmailEnabled: false,
    });
    const upgraded = buildPreference({
      documentsInAppEnabled: true,
      updatedAt: new Date("2026-06-17T10:05:00.000Z"),
    });
    const preferenceRows = makeSelectChain([legacyPreference]);
    const updateReturning = vi.fn().mockResolvedValue([upgraded]);
    const updateWhere = vi.fn().mockReturnValue({ returning: updateReturning });
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    const client = {
      select: vi.fn().mockReturnValue(preferenceRows),
      update: vi.fn().mockReturnValue({ set: updateSet }),
    };
    const service = buildService({ client });

    const result = await service.getPreferences(legacyPreference.userId);

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ documentsInAppEnabled: true }),
    );
    expect(result.data.documents.inAppEnabled).toBe(true);
  });

  it("does not upgrade preference rows that the user has customized", async () => {
    // Any deviation from the default shape means the user explicitly
    // touched their preferences — leave the row alone.
    const customized = buildPreference({
      driversInAppEnabled: false, // differs from default true
    });
    const preferenceRows = makeSelectChain([customized]);
    const updateMock = vi.fn();
    const client = {
      select: vi.fn().mockReturnValue(preferenceRows),
      update: updateMock,
    };
    const service = buildService({ client });

    const result = await service.getPreferences(customized.userId);

    expect(updateMock).not.toHaveBeenCalled();
    expect(result.data.drivers.inAppEnabled).toBe(false);
  });

  it("throws NotFoundException when marking another user's notification as read", async () => {
    // The update WHERE includes userId, so a foreign id matches zero rows.
    const updateReturning = vi.fn().mockResolvedValue([]);
    const updateWhere = vi.fn().mockReturnValue({ returning: updateReturning });
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    const client = {
      update: vi.fn().mockReturnValue({ set: updateSet }),
    };
    const service = buildService({ client });

    await expect(
      service.markAsRead(
        "22222222-2222-4222-8222-222222222222",
        "99999999-9999-4999-8999-999999999999",
      ),
    ).rejects.toThrow("Notification was not found");
  });

  it("skips dispatch when no channel is enabled", async () => {
    // Recipient with a customized preference (drivers disabled) so we
    // bypass the legacy-document upgrade path and reach the channel
    // resolution with all document channels off.
    const recipient = {
      email: "u@example.com",
      firstName: "U",
      id: "22222222-2222-4222-8222-222222222222",
      lastName: "Ser",
    };
    const preference = buildPreference({
      userId: recipient.id,
      driversInAppEnabled: false, // marks row as "customized" -> no upgrade
      documentsInAppEnabled: false,
      documentsEmailEnabled: false,
    });
    const recipientRows = makeSelectChain([recipient]);
    const preferenceRows = makeSelectChain([preference]);
    const insertMock = vi.fn();
    const client = {
      insert: insertMock,
      select: vi
        .fn()
        .mockReturnValueOnce(recipientRows)
        .mockReturnValueOnce(preferenceRows),
    };
    const service = buildService({ client });

    await expect(
      service.createDocumentProcessingNotifications({
        documentId: "55555555-5555-4555-8555-555555555555",
        fileName: "bill-of-lading.pdf",
        // uploader is someone else -> forceInApp is false
        status: "complete",
        uploadedByUserId: "77777777-7777-4777-8777-777777777777",
      }),
    ).resolves.toBeUndefined();

    expect(insertMock).not.toHaveBeenCalled();
  });

  it("no-ops document notifications while status is processing", async () => {
    const selectMock = vi.fn();
    const client = { select: selectMock };
    const service = buildService({ client });

    await expect(
      service.createDocumentProcessingNotifications({
        documentId: "55555555-5555-4555-8555-555555555555",
        fileName: "rate-confirmation.pdf",
        status: "processing",
      }),
    ).resolves.toBeUndefined();

    expect(selectMock).not.toHaveBeenCalled();
  });
});
