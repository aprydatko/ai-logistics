export const buildCacheKey = (
  namespace: string,
  operation: string,
  input?: unknown,
): string => {
  if (input === undefined) return `${namespace}:${operation}`;
  return `${namespace}:${operation}:${stableStringify(input)}`;
};

const stableStringify = (value: unknown): string => {
  return JSON.stringify(sortValue(value));
};

const sortValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortValue(nestedValue)]),
    );
  }

  return value;
};
