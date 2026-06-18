import { describe, expect, it, vi } from "vitest";

import type { MetricsService } from "../../common/metrics/metrics.service";
import { AssistantAuditService } from "./assistant-audit.service";
import { AssistantOpenAIClient } from "./internal/assistant-openai-client";
import { AssistantService } from "./assistant.service";
import { AssistantToolsService } from "./assistant-tools.service";

const createService = (
  {
    openAIApiKey,
  }: {
    openAIApiKey?: string | undefined;
  } = {
    openAIApiKey: "test-key",
  },
) => {
  const aiLogsService = {
    create: vi.fn(),
  };
  const configService = {
    get: vi.fn((key: string) => {
      if (key === "OPENAI_API_KEY") {
        return openAIApiKey;
      }
      if (key === "OPENAI_MODEL") {
        return "gpt-4.1-mini";
      }
      return undefined;
    }),
  };
  const databaseService = {
    client: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                firstName: "Sarah",
                lastName: "Dispatcher",
              },
            ]),
          })),
        })),
      })),
    },
  };
  const driversService = {
    findAll: vi.fn(),
    findById: vi.fn(),
  };
  const incidentsService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
  };
  const loadsService = {
    findAll: vi.fn(),
    findById: vi.fn(),
  };
  const assistantAuditService = new AssistantAuditService(
    aiLogsService as never,
    databaseService as never,
  );
  const metricsService = {
    recordAssistantRequest: vi.fn(),
  } as unknown as MetricsService;

  return {
    aiLogsService,
    driversService,
    incidentsService,
    loadsService,
    service: new AssistantService(
      configService as never,
      metricsService as never,
      assistantAuditService as never,
      new AssistantOpenAIClient(configService as never) as never,
      new AssistantToolsService(
        driversService as never,
        incidentsService as never,
        loadsService as never,
      ) as never,
    ),
  };
};

describe("AssistantService", () => {
  it("returns placeholder mode when OpenAI is not configured", async () => {
    const { aiLogsService, service } = createService({
      openAIApiKey: undefined,
    });

    await expect(
      service.respond(
        {
          message: "Summarize delayed loads",
        },
        {
          email: "dispatcher@example.com",
          id: "user-1",
          role: "dispatcher",
        },
      ),
    ).resolves.toEqual({
      conversationId: expect.any(String),
      message:
        "Assistant OpenAI setup is ready. Add OPENAI_API_KEY to apps/web/.env.local to enable real responses.",
      request: {
        message: "Summarize delayed loads",
        model: "gpt-4.1-mini",
      },
      status: "placeholder",
    });
    expect(aiLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: "OpenAI API key is not configured",
        operation: "incident_guidance",
        status: "failed",
      }),
    );
  });

  it("runs load search tools and returns tool metadata", async () => {
    const { aiLogsService, loadsService, service } = createService();
    loadsService.findAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: "load-1",
          referenceNumber: "LD-1001",
          status: "assigned",
          pickupAddress: "Dallas, TX",
          deliveryAddress: "Houston, TX",
          pickupDate: "2026-06-17T08:00:00.000Z",
          deliveryDate: "2026-06-17T14:00:00.000Z",
          miles: 240,
          weight: 1000,
          price: 1500,
          broker: { companyName: "Broker", id: "broker-1", phone: "123" },
          routePoints: [],
          timeline: [],
          notes: null,
          createdAt: "2026-06-16T08:00:00.000Z",
          updatedAt: "2026-06-16T09:00:00.000Z",
          driver: {
            id: "driver-1",
            firstName: "Sarah",
            lastName: "Davis",
            avatarUrl: null,
            truckNumber: "TR-12",
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
      },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_1",
          output: [
            {
              type: "function_call",
              name: "search_loads",
              call_id: "call_1",
              arguments: JSON.stringify({
                search: "Texas",
                status: "assigned",
              }),
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_2",
          output_text: "I found load LD-1001 assigned from Dallas to Houston.",
          usage: {
            input_tokens: 100,
            output_tokens: 25,
            total_tokens: 125,
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      service.respond(
        {
          message: "show assigned loads in Texas",
        },
        {
          email: "dispatcher@example.com",
          id: "user-1",
          role: "dispatcher",
        },
      ),
    ).resolves.toEqual({
      conversationId: expect.any(String),
      linkedEntity: {
        type: "load",
        recordId: "load-1",
        title: "LD-1001",
        route: "/loads",
      },
      message: "I found load LD-1001 assigned from Dallas to Houston.",
      reportType: undefined,
      request: {
        message: "show assigned loads in Texas",
        model: "gpt-4.1-mini",
      },
      resultView: {
        metrics: [
          { label: "Loads found", tone: "red", value: "1" },
          { label: "Assigned", tone: "teal", value: "1" },
          { label: "In transit", tone: "amber", value: "0" },
        ],
        rows: [
          {
            deliveryDate: "2026-06-17T14:00:00.000Z",
            driverCode: "TR-12",
            driverInitials: "SD",
            driverName: "Sarah Davis",
            id: "load-1",
            pickupDate: "2026-06-17T08:00:00.000Z",
            referenceNumber: "LD-1001",
            route: "Dallas, TX -> Houston, TX",
            status: "assigned",
          },
        ],
        summary: "1 load matched your request.",
        title: "Found 1 loads matching your request.",
        type: "loads_table",
      },
      status: "configured",
      usedTools: ["search_loads"],
    });
    expect(loadsService.findAll).toHaveBeenCalledOnce();
    expect(aiLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedEntity: {
          type: "load",
          recordId: "load-1",
          title: "LD-1001",
          route: "/loads",
        },
        operation: "chat",
        responseOutput: "I found load LD-1001 assigned from Dallas to Houston.",
        status: "success",
      }),
    );
  });

  it("runs driver search tools and returns a drivers table result", async () => {
    const { driversService, service } = createService();
    driversService.findAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: "driver-1",
          userId: "user-2",
          driverCode: "ID-1024",
          firstName: "Arthur",
          lastName: "Prydatko",
          email: "arthur@example.com",
          phone: "+10000000000",
          avatarUrl: null,
          dateOfBirth: null,
          address: null,
          hireDate: "2026-01-01",
          licenseType: "CDL-A",
          licenseNumber: "AA-123",
          licenseExpirationDate: "2028-01-01",
          licenseState: "Texas",
          emergencyContact: null,
          emergencyPhone: null,
          notes: null,
          rating: 4.8,
          truckNumber: "TR-01",
          trailerNumber: "TL-09",
          isActive: true,
          status: "available",
          currentLocation: undefined,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      pagination: {
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
      },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_1",
          output: [
            {
              type: "function_call",
              name: "search_drivers",
              call_id: "call_1",
              arguments: JSON.stringify({
                search: "Arthur",
                status: "available",
              }),
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_2",
          output_text: "I found one available driver.",
          usage: {
            input_tokens: 70,
            output_tokens: 16,
            total_tokens: 86,
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      service.respond(
        {
          message: "list available drivers and show the results in a table",
        },
        {
          email: "dispatcher@example.com",
          id: "user-1",
          role: "dispatcher",
        },
      ),
    ).resolves.toEqual({
      conversationId: expect.any(String),
      linkedEntity: {
        type: "driver",
        recordId: "driver-1",
        title: "Arthur Prydatko",
        route: "/drivers/driver-1",
      },
      message: "I found one available driver.",
      reportType: undefined,
      request: {
        message: "list available drivers and show the results in a table",
        model: "gpt-4.1-mini",
      },
      resultView: {
        metrics: [
          { label: "Drivers found", tone: "red", value: "1" },
          { label: "Available", tone: "teal", value: "1" },
          { label: "On trip", tone: "amber", value: "0" },
        ],
        rows: [
          {
            driverCode: "ID-1024",
            id: "driver-1",
            isActive: true,
            name: "Arthur Prydatko",
            status: "available",
            trailerNumber: "TL-09",
            truckNumber: "TR-01",
          },
        ],
        summary: "1 driver matched your request.",
        title: "Found 1 available drivers matching your request.",
        type: "drivers_table",
      },
      status: "configured",
      usedTools: ["search_drivers"],
    });
    expect(driversService.findAll).toHaveBeenCalledOnce();
  });

  it("runs incident search tools and returns an incidents table result", async () => {
    const { incidentsService, service } = createService();
    incidentsService.findAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: "incident-1",
          title: "Tire failure near Dallas",
          description: "Front tire burst during transit",
          location: "Dallas, TX",
          type: "flat_tire",
          priority: "critical",
          status: "open",
          occurredAt: "2026-06-17T09:30:00.000Z",
          resolvedAt: null,
          createdAt: "2026-06-17T09:35:00.000Z",
          updatedAt: "2026-06-17T09:35:00.000Z",
          timeline: [],
          load: {
            id: "load-1",
            referenceNumber: "LD-1001",
            driver: {
              id: "driver-1",
              firstName: "Sarah",
              lastName: "Davis",
              truckNumber: "TR-12",
            },
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
      },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_1",
          output: [
            {
              type: "function_call",
              name: "search_incidents",
              call_id: "call_1",
              arguments: JSON.stringify({
                priority: "critical",
                status: "open",
              }),
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_2",
          output_text: "I found one critical incident.",
          usage: {
            input_tokens: 74,
            output_tokens: 17,
            total_tokens: 91,
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      service.respond(
        {
          message: "list critical incidents and show the results in a table",
        },
        {
          email: "dispatcher@example.com",
          id: "user-1",
          role: "dispatcher",
        },
      ),
    ).resolves.toEqual({
      conversationId: expect.any(String),
      linkedEntity: {
        type: "incident",
        recordId: "incident-1",
        title: "Tire failure near Dallas",
        route: "/incidents/incident-1",
      },
      message: "I found one critical incident.",
      reportType: undefined,
      request: {
        message: "list critical incidents and show the results in a table",
        model: "gpt-4.1-mini",
      },
      resultView: {
        metrics: [
          { label: "Incidents found", tone: "red", value: "1" },
          { label: "Critical", tone: "teal", value: "1" },
          { label: "Open", tone: "amber", value: "1" },
        ],
        rows: [
          {
            driverName: "Sarah Davis",
            id: "incident-1",
            loadReferenceNumber: "LD-1001",
            occurredAt: "2026-06-17T09:30:00.000Z",
            priority: "critical",
            status: "open",
            title: "Tire failure near Dallas",
            type: "flat_tire",
          },
        ],
        summary: "1 incident matched your request.",
        title: "Found 1 critical incidents matching your request.",
        type: "incidents_table",
      },
      status: "configured",
      usedTools: ["search_incidents"],
    });
    expect(incidentsService.findAll).toHaveBeenCalledOnce();
  });

  it("resolves get_driver_details by driver code before loading details", async () => {
    const { driversService, service } = createService();
    driversService.findAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: "driver-1",
          driverCode: "ID-1024",
          firstName: "Arthur",
          lastName: "Prydatko",
          email: "arthur@example.com",
          phone: "+10000000000",
          avatarUrl: null,
          dateOfBirth: null,
          address: null,
          hireDate: "2026-01-01",
          licenseType: "CDL-A",
          licenseNumber: "AA-123",
          licenseExpirationDate: "2028-01-01",
          licenseState: "Texas",
          emergencyContact: null,
          emergencyPhone: null,
          notes: null,
          rating: 4.8,
          truckNumber: "TR-01",
          trailerNumber: null,
          isActive: true,
          status: "available",
          currentLocation: undefined,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
    });
    driversService.findById.mockResolvedValue({
      success: true,
      data: {
        id: "driver-1",
        driverCode: "ID-1024",
        firstName: "Arthur",
        lastName: "Prydatko",
        email: "arthur@example.com",
        phone: "+10000000000",
        avatarUrl: null,
        dateOfBirth: null,
        address: null,
        hireDate: "2026-01-01",
        licenseType: "CDL-A",
        licenseNumber: "AA-123",
        licenseExpirationDate: "2028-01-01",
        licenseState: "Texas",
        emergencyContact: null,
        emergencyPhone: null,
        notes: null,
        rating: 4.8,
        truckNumber: "TR-01",
        trailerNumber: null,
        isActive: true,
        status: "available",
        currentLocation: undefined,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        currentVehicle: null,
        documents: [
          {
            id: "doc-1",
            driverId: "driver-1",
            type: "license",
            name: "Commercial Driver License",
            documentNumber: "ID-1024-LIC",
            fileUrl: "data:application/pdf;base64,VERY_LARGE_BASE64_CONTENT",
            storageKey: null,
            mimeType: "application/pdf",
            fileSize: 123456,
            issuedAt: "2026-01-01",
            expiresAt: "2028-01-01",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        tripsHistory: [
          {
            id: "trip-1",
            referenceNumber: "LD-1024",
            pickupAddress: "Dallas, TX",
            deliveryAddress: "Austin, TX",
            pickupDate: "2026-06-01T08:00:00.000Z",
            deliveryDate: "2026-06-01T14:00:00.000Z",
            weight: 1200,
            price: 900,
            miles: 200,
            notes: null,
            status: "delivered",
            broker: { id: "broker-1", companyName: "Broker", phone: "123" },
            routePoints: [{ label: "Huge route payload" }],
            timeline: [{ title: "Large timeline payload" }],
            driverId: "driver-1",
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
        ],
        activity: [
          {
            id: "activity-1",
            driverId: "driver-1",
            type: "updated",
            description: "Updated driver profile",
            metadata: { verbose: "payload" },
            createdAt: "2026-06-02T00:00:00.000Z",
          },
        ],
      },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_1",
          output: [
            {
              type: "function_call",
              name: "get_driver_details",
              call_id: "call_1",
              arguments: JSON.stringify({
                driverId: "ID-1024",
              }),
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_2",
          output_text: "Driver Arthur Prydatko is available.",
          usage: {
            input_tokens: 60,
            output_tokens: 15,
            total_tokens: 75,
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      service.respond(
        {
          message: "find driver ID: ID-1024",
        },
        {
          email: "dispatcher@example.com",
          id: "user-1",
          role: "dispatcher",
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        linkedEntity: {
          type: "driver",
          recordId: "driver-1",
          title: "Arthur Prydatko",
          route: "/drivers/driver-1",
        },
        message: "Driver Arthur Prydatko is available.",
        status: "configured",
        usedTools: ["get_driver_details"],
      }),
    );
    expect(driversService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "ID-1024",
      }),
    );
    expect(driversService.findById).toHaveBeenCalledWith("driver-1");
    const toolOutputBody = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body),
    );
    expect(JSON.stringify(toolOutputBody)).not.toContain(
      "VERY_LARGE_BASE64_CONTENT",
    );
    expect(JSON.stringify(toolOutputBody)).not.toContain("Huge route payload");
  });

  it("serializes assistant history with output_text for follow-up requests", async () => {
    const { service } = createService();
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        id: "resp_1",
        output_text: "The driver has a CDL and medical certificate on file.",
        usage: {
          input_tokens: 40,
          output_tokens: 12,
          total_tokens: 52,
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      service.respond(
        {
          message: "What documents does this driver have?",
          history: [
            {
              role: "user",
              text: "find a driver Arthur Prydatko",
            },
            {
              role: "assistant",
              text: "Arthur Prydatko is an active and available driver with the driver code ID-1024.",
            },
          ],
          linkedEntity: {
            type: "driver",
            recordId: "driver-1",
            title: "Arthur Prydatko",
            route: "/drivers/driver-1",
          },
        },
        {
          email: "dispatcher@example.com",
          id: "user-1",
          role: "dispatcher",
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        message: "The driver has a CDL and medical certificate on file.",
        status: "configured",
      }),
    );

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(requestBody.input).toEqual([
      {
        role: "user",
        content: [
          { type: "input_text", text: "find a driver Arthur Prydatko" },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "output_text",
            text: "Arthur Prydatko is an active and available driver with the driver code ID-1024.",
          },
        ],
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: "What documents does this driver have?" },
        ],
      },
    ]);
  });

  it("normalizes generic incident count searches into structured filters", async () => {
    const { incidentsService, service } = createService();
    incidentsService.findAll.mockResolvedValue({
      success: true,
      data: Array.from({ length: 10 }, (_, index) => ({
        id: `incident-${index + 1}`,
        title: `Open incident ${index + 1}`,
        description: "Open incident summary",
        location: "Dallas, TX",
        type: "delay",
        priority: "medium",
        status: "open",
        occurredAt: "2026-06-17T08:00:00.000Z",
        resolvedAt: null,
        createdAt: "2026-06-17T08:00:00.000Z",
        updatedAt: "2026-06-17T08:00:00.000Z",
        timeline: [],
        load: {
          id: `load-${index + 1}`,
          referenceNumber: `LD-${index + 1}`,
          driver: null,
        },
      })),
      pagination: { page: 1, limit: 5, total: 10, totalPages: 2 },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_1",
          output: [
            {
              type: "function_call",
              name: "search_incidents",
              call_id: "call_1",
              arguments: JSON.stringify({
                search: "open incidentd",
                limit: 5,
              }),
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_2",
          output_text: "There are 10 open incidents.",
          usage: {
            input_tokens: 80,
            output_tokens: 12,
            total_tokens: 92,
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      service.respond(
        {
          message: "tell me how many open incidentd does you you have?",
        },
        {
          email: "dispatcher@example.com",
          id: "user-1",
          role: "dispatcher",
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        message: "There are 10 open incidents.",
        status: "configured",
        usedTools: ["search_incidents"],
      }),
    );

    expect(incidentsService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 5,
        page: 1,
        priority: undefined,
        search: undefined,
        status: "open",
        type: undefined,
      }),
    );

    const toolOutputBody = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body),
    );
    const nestedOutput = JSON.parse(String(toolOutputBody.input?.[0]?.output));
    expect(nestedOutput).toEqual(
      expect.objectContaining({
        count: 10,
      }),
    );
  });

  it("ignores invalid load date filters from tool arguments instead of failing", async () => {
    const { loadsService, service } = createService();
    loadsService.findAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: "load-1",
          referenceNumber: "LD-1001",
          status: "assigned",
          pickupAddress: "Dallas, TX",
          deliveryAddress: "Houston, TX",
          pickupDate: "2026-06-17T08:00:00.000Z",
          deliveryDate: "2026-06-17T14:00:00.000Z",
          miles: 240,
          weight: 1000,
          price: 1500,
          broker: { companyName: "Broker", id: "broker-1", phone: "123" },
          routePoints: [],
          timeline: [],
          notes: null,
          createdAt: "2026-06-16T08:00:00.000Z",
          updatedAt: "2026-06-16T09:00:00.000Z",
          driver: {
            id: "driver-1",
            firstName: "Sarah",
            lastName: "Davis",
            avatarUrl: null,
            truckNumber: "TR-12",
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
      },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_1",
          output: [
            {
              type: "function_call",
              name: "search_loads",
              call_id: "call_1",
              arguments: JSON.stringify({
                search: "Texas",
                status: "assigned",
                pickupFrom: "not-a-date",
              }),
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_2",
          output_text: "I found one assigned load in Texas.",
          usage: {
            input_tokens: 40,
            output_tokens: 12,
            total_tokens: 52,
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      service.respond(
        {
          message:
            "Show me assigned loads in Texas and format the result as a table",
        },
        {
          email: "dispatcher@example.com",
          id: "user-1",
          role: "dispatcher",
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        message: "I found one assigned load in Texas.",
        status: "configured",
        usedTools: ["search_loads"],
      }),
    );

    expect(loadsService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        pickupFrom: undefined,
        search: "Texas",
        status: "assigned",
      }),
    );
  });
});
