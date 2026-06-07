import type { DriversApiItem } from "./drivers-query";
import type { DriverFormValues } from "./driver-form-schema";

const readError = async (response: Response): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);

  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return "Unable to save driver";
};

export const saveDriver = async ({
  driverId,
  values,
}: {
  driverId?: string;
  values: DriverFormValues;
}): Promise<DriversApiItem> => {
  const normalizedPayload = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ]),
  );
  const response = await fetch(
    driverId ? `/api/drivers/${driverId}` : "/api/drivers",
    {
      method: driverId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedPayload),
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body: unknown = await response.json();
  const data =
    body && typeof body === "object" && "data" in body ? body.data : body;

  return data as DriversApiItem;
};
