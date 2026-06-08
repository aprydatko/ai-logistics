export const formatDate = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not provided";

export const getDocumentStatus = (
  expiresAt: string | null,
): { label: string; tone: "success" | "warning" | "danger" } => {
  if (!expiresAt) return { label: "No expiry", tone: "success" };

  const daysRemaining =
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  if (daysRemaining < 0) return { label: "Expired", tone: "danger" };
  if (daysRemaining <= 30) return { label: "Expiring", tone: "warning" };

  return { label: "Valid", tone: "success" };
};
