import type {
  AssistantDriversTableResult,
  DriverSearchOutput,
} from "./assistant.types";

type DriverSearchStatus = DriverSearchOutput["items"][number]["status"];

/**
 * Builds a structured table result for driver search output.
 * Includes metrics for available and on-trip drivers.
 *
 * @param params - The build parameters
 * @param params.message - The original user message for title generation
 * @param params.output - The raw search output from tool execution
 * @returns The structured table result or undefined if no items found
 */
export const buildDriversTableResult = ({
  message,
  output,
}: {
  message: string;
  output: Record<string, unknown>;
}): AssistantDriversTableResult | undefined => {
  const parsed = parseDriverSearchOutput(output);
  if (!parsed || parsed.items.length === 0) {
    return undefined;
  }

  const availableCount = parsed.items.filter(
    (item) => item.status === "available",
  ).length;
  const onTripCount = parsed.items.filter(
    (item) => item.status === "on_trip",
  ).length;

  return {
    metrics: [
      {
        label: "Drivers found",
        tone: "red",
        value: String(parsed.count),
      },
      {
        label: "Available",
        tone: "teal",
        value: String(availableCount),
      },
      {
        label: "On trip",
        tone: "amber",
        value: String(onTripCount),
      },
    ],
    rows: parsed.items.map((item) => ({
      driverCode: item.driverCode,
      id: item.id,
      isActive: item.isActive,
      name: `${item.firstName} ${item.lastName}`.trim(),
      status: item.status,
      trailerNumber: item.trailerNumber,
      truckNumber: item.truckNumber,
    })),
    summary: `${parsed.count} driver${parsed.count === 1 ? "" : "s"} matched your request.`,
    title: buildDriversTableTitle(parsed.count, message),
    type: "drivers_table",
  };
};

/**
 * Parses and validates driver search output from tool execution.
 * Ensures all required fields are present and correctly typed.
 *
 * @param output - The raw output to parse
 * @returns The parsed driver search output or undefined if invalid
 */
const parseDriverSearchOutput = (
  output: Record<string, unknown>,
): DriverSearchOutput | undefined => {
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
      typeof candidate.driverCode !== "string" ||
      typeof candidate.firstName !== "string" ||
      typeof candidate.lastName !== "string" ||
      typeof candidate.status !== "string" ||
      typeof candidate.isActive !== "boolean"
    ) {
      return [];
    }

    if (!isDriverSearchStatus(candidate.status)) {
      return [];
    }

    return [
      {
        driverCode: candidate.driverCode,
        firstName: candidate.firstName,
        id: candidate.id,
        isActive: candidate.isActive,
        lastName: candidate.lastName,
        status: candidate.status,
        trailerNumber:
          typeof candidate.trailerNumber === "string"
            ? candidate.trailerNumber
            : null,
        truckNumber:
          typeof candidate.truckNumber === "string"
            ? candidate.truckNumber
            : null,
      },
    ];
  });

  return {
    count,
    items: normalizedItems,
  };
};

/**
 * Generates a contextual title for the drivers table based on search criteria.
 *
 * @param count - The number of drivers found
 * @param message - The original user message
 * @returns A descriptive title for the table
 */
const buildDriversTableTitle = (count: number, message: string): string => {
  const normalized = message.toLowerCase();
  if (normalized.includes("available")) {
    return `Found ${count} available drivers matching your request.`;
  }
  if (normalized.includes("maintenance")) {
    return `Found ${count} drivers in maintenance matching your request.`;
  }
  return `Found ${count} drivers matching your request.`;
};

const isDriverSearchStatus = (value: unknown): value is DriverSearchStatus =>
  value === "available" ||
  value === "on_trip" ||
  value === "off_duty" ||
  value === "maintenance";
