const parseDateOnly = (value: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new RangeError(`Invalid date-only value: ${value}`);

  const [, year, month, day] = match;

  return new Date(Number(year), Number(month) - 1, Number(day));
};

const toCalendarDay = (value: Date): number =>
  Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());

export const formatDate = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
        parseDateOnly(value),
      )
    : "Not provided";

export const getDocumentStatus = (
  expiresAt: string | null,
): { label: string; tone: "success" | "warning" | "danger" } => {
  if (!expiresAt) return { label: "No expiry", tone: "success" };

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining =
    (toCalendarDay(parseDateOnly(expiresAt)) - toCalendarDay(new Date())) /
    millisecondsPerDay;

  if (daysRemaining < 0) return { label: "Expired", tone: "danger" };
  if (daysRemaining <= 30) return { label: "Expiring", tone: "warning" };

  return { label: "Valid", tone: "success" };
};
