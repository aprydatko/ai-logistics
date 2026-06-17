export const supportedModels = new Set(["gpt-4.1", "gpt-4.1-mini", "o3"]);

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const modelPricing = {
  "gpt-4.1-mini": { prompt: 0.4, completion: 1.6 },
  "gpt-4.1": { prompt: 2, completion: 8 },
} as const;

export const toolDefinitions = [
  {
    type: "function",
    name: "search_loads",
    description:
      "Find loads by search text, status, date range, or driver assignment for user questions and reports.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        search: { type: "string" },
        status: {
          type: "string",
          enum: ["pending", "assigned", "in_transit", "delivered", "cancelled"],
        },
        driverId: { type: "string" },
        pickupFrom: { type: "string" },
        pickupTo: { type: "string" },
        limit: { type: "number" },
      },
      required: [],
    },
  },
  {
    type: "function",
    name: "search_drivers",
    description:
      "Find drivers by name, code, truck, trailer, status, or activity state.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        search: { type: "string" },
        status: {
          type: "string",
          enum: ["available", "on_trip", "off_duty", "maintenance"],
        },
        isActive: { type: "boolean" },
        truckNumber: { type: "string" },
        trailerNumber: { type: "string" },
        limit: { type: "number" },
      },
      required: [],
    },
  },
  {
    type: "function",
    name: "search_incidents",
    description:
      "Find incidents by title, description, load reference, type, priority, or status.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        search: { type: "string" },
        type: {
          type: "string",
          enum: [
            "flat_tire",
            "delay",
            "accident",
            "fuel_issue",
            "maintenance",
            "other",
          ],
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
        },
        status: {
          type: "string",
          enum: ["open", "investigating", "monitoring", "resolved", "closed"],
        },
        driverId: { type: "string" },
        loadId: { type: "string" },
        limit: { type: "number" },
      },
      required: [],
    },
  },
  {
    type: "function",
    name: "get_load_details",
    description: "Fetch detailed information about one load by id.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        loadId: { type: "string" },
      },
      required: ["loadId"],
    },
  },
  {
    type: "function",
    name: "get_driver_details",
    description: "Fetch detailed information about one driver by id.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        driverId: { type: "string" },
      },
      required: ["driverId"],
    },
  },
  {
    type: "function",
    name: "get_incident_details",
    description: "Fetch detailed information about one incident by id.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        incidentId: { type: "string" },
      },
      required: ["incidentId"],
    },
  },
  {
    type: "function",
    name: "generate_incident_guidance",
    description:
      "Generate read-only recommended next steps for an incident using current status, priority, type, and timeline context.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        incidentId: { type: "string" },
        focus: { type: "string" },
      },
      required: ["incidentId"],
    },
  },
] as const;
