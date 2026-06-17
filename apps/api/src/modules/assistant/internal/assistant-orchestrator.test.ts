import { InternalServerErrorException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { runAssistantOrchestration } from "./assistant-orchestrator";

describe("runAssistantOrchestration", () => {
  it("returns a direct assistant response when no tool call is needed", async () => {
    const executeTool = vi.fn();
    const requestOpenAI = vi.fn();

    await expect(
      runAssistantOrchestration({
        executeTool,
        initialResponse: {
          id: "resp_direct",
          output_text: "No delayed loads were found.",
          usage: {
            input_tokens: 18,
            output_tokens: 7,
            total_tokens: 25,
          },
        },
        message: "show delayed loads",
        model: "gpt-4.1-mini",
        requestOpenAI,
      }),
    ).resolves.toEqual({
      assistantMessage: "No delayed loads were found.",
      providerRequestId: "resp_direct",
      resolvedEntity: undefined,
      resultView: undefined,
      usage: {
        completionTokens: 7,
        promptTokens: 18,
        totalTokens: 25,
      },
      usedTools: [],
    });

    expect(executeTool).not.toHaveBeenCalled();
    expect(requestOpenAI).not.toHaveBeenCalled();
  });

  it("executes tool calls, follows up with OpenAI, and builds load table results", async () => {
    const executeTool = vi
      .fn()
      .mockResolvedValue({
        linkedEntity: {
          type: "load",
          recordId: "load-1",
          title: "LD-1001",
          route: "/loads",
        },
        output: {
          count: 1,
          items: [
            {
              id: "load-1",
              referenceNumber: "LD-1001",
              status: "assigned",
              pickupAddress: "Dallas, TX",
              deliveryAddress: "Houston, TX",
              pickupDate: "2026-06-17T08:00:00.000Z",
              deliveryDate: "2026-06-17T14:00:00.000Z",
              driver: "Sarah Davis",
              driverCode: "TR-12",
            },
          ],
        },
      });
    const requestOpenAI = vi.fn().mockResolvedValue({
      id: "resp_followup",
      output_text: "I found one assigned load in Texas.",
      usage: {
        input_tokens: 60,
        output_tokens: 11,
        total_tokens: 71,
      },
    });

    await expect(
      runAssistantOrchestration({
        executeTool,
        initialResponse: {
          id: "resp_initial",
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
        },
        message: "Show me assigned loads in Texas and format the result as a table",
        model: "gpt-4.1-mini",
        requestOpenAI,
      }),
    ).resolves.toEqual({
      assistantMessage: "I found one assigned load in Texas.",
      providerRequestId: "resp_followup",
      resolvedEntity: {
        type: "load",
        recordId: "load-1",
        title: "LD-1001",
        route: "/loads",
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
      usage: {
        completionTokens: 11,
        promptTokens: 60,
        totalTokens: 71,
      },
      usedTools: ["search_loads"],
    });

    expect(executeTool).toHaveBeenCalledWith({
      arguments: JSON.stringify({
        search: "Texas",
        status: "assigned",
      }),
      callId: "call_1",
      name: "search_loads",
    });
    expect(requestOpenAI).toHaveBeenCalledWith({
      input: [
        {
          call_id: "call_1",
          output: JSON.stringify({
            count: 1,
            items: [
              {
                id: "load-1",
                referenceNumber: "LD-1001",
                status: "assigned",
                pickupAddress: "Dallas, TX",
                deliveryAddress: "Houston, TX",
                pickupDate: "2026-06-17T08:00:00.000Z",
                deliveryDate: "2026-06-17T14:00:00.000Z",
                driver: "Sarah Davis",
                driverCode: "TR-12",
              },
            ],
          }),
          type: "function_call_output",
        },
      ],
      model: "gpt-4.1-mini",
      previous_response_id: "resp_initial",
    });
  });

  it("builds a drivers table result for driver search tool calls", async () => {
    const executeTool = vi.fn().mockResolvedValue({
      linkedEntity: {
        type: "driver",
        recordId: "driver-1",
        title: "Arthur Prydatko",
        route: "/drivers/driver-1",
      },
      output: {
        count: 1,
        items: [
          {
            id: "driver-1",
            driverCode: "ID-1024",
            firstName: "Arthur",
            lastName: "Prydatko",
            status: "available",
            isActive: true,
            truckNumber: "TR-01",
            trailerNumber: "TL-09",
          },
        ],
      },
    });
    const requestOpenAI = vi.fn().mockResolvedValue({
      id: "resp_followup",
      output_text: "I found one available driver.",
      usage: {
        input_tokens: 44,
        output_tokens: 10,
        total_tokens: 54,
      },
    });

    await expect(
      runAssistantOrchestration({
        executeTool,
        initialResponse: {
          id: "resp_initial",
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
        },
        message: "List available drivers and show the results in a table",
        model: "gpt-4.1-mini",
        requestOpenAI,
      }),
    ).resolves.toEqual({
      assistantMessage: "I found one available driver.",
      providerRequestId: "resp_followup",
      resolvedEntity: {
        type: "driver",
        recordId: "driver-1",
        title: "Arthur Prydatko",
        route: "/drivers/driver-1",
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
      usage: {
        completionTokens: 10,
        promptTokens: 44,
        totalTokens: 54,
      },
      usedTools: ["search_drivers"],
    });
  });

  it("throws when OpenAI omits a response id for a tool call turn", async () => {
    await expect(
      runAssistantOrchestration({
        executeTool: vi.fn(),
        initialResponse: {
          output: [
            {
              type: "function_call",
              name: "search_drivers",
              call_id: "call_1",
              arguments: JSON.stringify({ search: "Arthur" }),
            },
          ],
        },
        message: "find driver Arthur",
        model: "gpt-4.1-mini",
        requestOpenAI: vi.fn(),
      }),
    ).rejects.toThrowError(
      new InternalServerErrorException(
        "OpenAI tool response is missing a response id",
      ),
    );
  });

  it("throws when the final OpenAI response is empty", async () => {
    await expect(
      runAssistantOrchestration({
        executeTool: vi.fn(),
        initialResponse: {
          id: "resp_empty",
          output: [],
        },
        message: "summarize loads",
        model: "gpt-4.1-mini",
        requestOpenAI: vi.fn(),
      }),
    ).rejects.toThrowError(
      new InternalServerErrorException("OpenAI returned an empty response"),
    );
  });
});
