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
      { emitNotificationCreated: vi.fn(), emitNotificationRead: vi.fn(), emitUnreadCountUpdated: vi.fn(), emitDashboardIncidentStatsUpdated: vi.fn() } as never,
      { sendNotificationEmail: vi.fn() } as never,
    );

    await expect(service.listForUser("22222222-2222-4222-8222-222222222222"))
      .resolves.toEqual({
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
});
