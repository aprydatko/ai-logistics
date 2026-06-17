import type {
  AssistantLoadsTableResult,
  LoadSearchOutput,
} from "./assistant.types";

/**
 * Builds a structured table result for load search output.
 * Includes metrics for assigned and in-transit loads.
 *
 * @param params - The build parameters
 * @param params.message - The original user message for title generation
 * @param params.output - The raw search output from tool execution
 * @returns The structured table result or undefined if no items found
 */
export const buildLoadsTableResult = ({
  message,
  output,
}: {
  message: string;
  output: Record<string, unknown>;
}): AssistantLoadsTableResult | undefined => {
  const parsed = parseLoadSearchOutput(output);
  if (!parsed || parsed.items.length === 0) {
    return undefined;
  }

  const title = buildLoadsTableTitle(parsed.count, message);
  const assignedCount = parsed.items.filter(
    (item) => item.status === "assigned",
  ).length;
  const inTransitCount = parsed.items.filter(
    (item) => item.status === "in_transit",
  ).length;

  return {
    metrics: [
      {
        label: "Loads found",
        tone: "red",
        value: String(parsed.count),
      },
      {
        label: "Assigned",
        tone: "teal",
        value: String(assignedCount),
      },
      {
        label: "In transit",
        tone: "amber",
        value: String(inTransitCount),
      },
    ],
    rows: parsed.items.map((item) => ({
      deliveryDate: item.deliveryDate,
      driverCode: item.driverCode,
      driverInitials: toInitials(item.driver),
      driverName: item.driver,
      id: item.id,
      pickupDate: item.pickupDate,
      referenceNumber: item.referenceNumber,
      route: `${item.pickupAddress} -> ${item.deliveryAddress}`,
      status: item.status,
    })),
    summary: `${parsed.count} load${parsed.count === 1 ? "" : "s"} matched your request.`,
    title,
    type: "loads_table",
  };
};

/**
 * Parses and validates load search output from tool execution.
 * Ensures all required fields are present and correctly typed.
 *
 * @param output - The raw output to parse
 * @returns The parsed load search output or undefined if invalid
 */
const parseLoadSearchOutput = (
  output: Record<string, unknown>,
): LoadSearchOutput | undefined => {
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
      typeof candidate.referenceNumber !== "string" ||
      typeof candidate.status !== "string" ||
      typeof candidate.pickupAddress !== "string" ||
      typeof candidate.deliveryAddress !== "string" ||
      typeof candidate.pickupDate !== "string" ||
      typeof candidate.deliveryDate !== "string"
    ) {
      return [];
    }

    return [
      {
        deliveryAddress: candidate.deliveryAddress,
        deliveryDate: candidate.deliveryDate,
        driver: typeof candidate.driver === "string" ? candidate.driver : null,
        driverCode:
          typeof candidate.driverCode === "string"
            ? candidate.driverCode
            : null,
        id: candidate.id,
        miles: typeof candidate.miles === "number" ? candidate.miles : 0,
        pickupAddress: candidate.pickupAddress,
        pickupDate: candidate.pickupDate,
        referenceNumber: candidate.referenceNumber,
        status: candidate.status,
      },
    ];
  });

  return {
    count,
    items: normalizedItems,
  };
};

/**
 * Generates a contextual title for the loads table based on search criteria.
 *
 * @param count - The number of loads found
 * @param message - The original user message
 * @returns A descriptive title for the table
 */
const buildLoadsTableTitle = (count: number, message: string): string => {
  const normalized = message.toLowerCase();
  if (normalized.includes("delayed")) {
    return `Found ${count} delayed or at-risk loads matching your request.`;
  }
  if (normalized.includes("midwest")) {
    return `Found ${count} loads matching your Midwest request.`;
  }
  return `Found ${count} loads matching your request.`;
};

const toInitials = (driverName: string | null): string | null => {
  if (!driverName) {
    return null;
  }

  const parts = driverName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};
