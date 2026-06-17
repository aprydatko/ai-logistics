import type {
  AssistantIncidentsTableResult,
  IncidentSearchOutput,
} from "./assistant.types";

type IncidentPriority = IncidentSearchOutput["items"][number]["priority"];
type IncidentStatus = IncidentSearchOutput["items"][number]["status"];

export const buildIncidentsTableResult = ({
  message,
  output,
}: {
  message: string;
  output: Record<string, unknown>;
}): AssistantIncidentsTableResult | undefined => {
  const parsed = parseIncidentSearchOutput(output);
  if (!parsed || parsed.items.length === 0) {
    return undefined;
  }

  const criticalCount = parsed.items.filter(
    (item) => item.priority === "critical",
  ).length;
  const openCount = parsed.items.filter((item) => item.status === "open").length;

  return {
    metrics: [
      {
        label: "Incidents found",
        tone: "red",
        value: String(parsed.count),
      },
      {
        label: "Critical",
        tone: "teal",
        value: String(criticalCount),
      },
      {
        label: "Open",
        tone: "amber",
        value: String(openCount),
      },
    ],
    rows: parsed.items.map((item) => ({
      driverName: item.driver,
      id: item.id,
      loadReferenceNumber: item.loadReferenceNumber,
      occurredAt: item.occurredAt,
      priority: item.priority,
      status: item.status,
      title: item.title,
      type: item.type,
    })),
    summary: `${parsed.count} incident${parsed.count === 1 ? "" : "s"} matched your request.`,
    title: buildIncidentsTableTitle(parsed.count, message),
    type: "incidents_table",
  };
};

const parseIncidentSearchOutput = (
  output: Record<string, unknown>,
): IncidentSearchOutput | undefined => {
  const count = output.count;
  const items = output.items;

  if (typeof count !== "number" || !Array.isArray(items)) {
    return undefined;
  }

  const normalizedItems = items.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.title !== "string" ||
      typeof candidate.type !== "string" ||
      typeof candidate.loadReferenceNumber !== "string" ||
      typeof candidate.occurredAt !== "string" ||
      !isIncidentPriority(candidate.priority) ||
      !isIncidentStatus(candidate.status)
    ) {
      return [];
    }

    return [
      {
        driver: typeof candidate.driver === "string" ? candidate.driver : null,
        id: candidate.id,
        loadReferenceNumber: candidate.loadReferenceNumber,
        occurredAt: candidate.occurredAt,
        priority: candidate.priority,
        status: candidate.status,
        title: candidate.title,
        type: candidate.type,
      },
    ];
  });

  return {
    count,
    items: normalizedItems,
  };
};

const buildIncidentsTableTitle = (count: number, message: string): string => {
  const normalized = message.toLowerCase();
  if (normalized.includes("critical")) {
    return `Found ${count} critical incidents matching your request.`;
  }
  if (normalized.includes("open")) {
    return `Found ${count} open incidents matching your request.`;
  }
  return `Found ${count} incidents matching your request.`;
};

const isIncidentPriority = (value: unknown): value is IncidentPriority =>
  value === "low" ||
  value === "medium" ||
  value === "high" ||
  value === "critical";

const isIncidentStatus = (value: unknown): value is IncidentStatus =>
  value === "open" ||
  value === "investigating" ||
  value === "monitoring" ||
  value === "resolved" ||
  value === "closed";
