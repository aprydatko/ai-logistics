import { randomUUID } from "node:crypto";

export const resolveRequestId = (
  headerValue: string | string[] | undefined,
): string => {
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!candidate) {
    return randomUUID();
  }

  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : randomUUID();
};
