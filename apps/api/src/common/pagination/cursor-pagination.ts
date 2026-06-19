type CursorPayload = {
  createdAt: string;
  id: string;
};

export type CursorPage = {
  createdAt: Date;
  id: string;
};

export const encodeCursor = (value: CursorPage): string =>
  Buffer.from(
    JSON.stringify({
      createdAt: value.createdAt.toISOString(),
      id: value.id,
    } satisfies CursorPayload),
    "utf8",
  ).toString("base64url");

export const decodeCursor = (value: string): CursorPage | null => {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<CursorPayload>;

    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
      return null;
    }

    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    return {
      createdAt,
      id: parsed.id,
    };
  } catch {
    return null;
  }
};
