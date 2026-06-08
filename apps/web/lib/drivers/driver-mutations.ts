import type { DriversApiItem } from "./drivers-query";
import type { DriverFormValues } from "./driver-form-schema";

const readError = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);

  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return fallbackMessage;
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
    throw new Error(await readError(response, "Unable to save driver"));
  }

  const body: unknown = await response.json();
  const data =
    body && typeof body === "object" && "data" in body ? body.data : body;

  return data as DriversApiItem;
};

export const deleteDriver = async (driverId: string): Promise<void> => {
  const response = await fetch(`/api/drivers/${driverId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Unable to delete driver"));
  }
};

export type DriverDocumentInput = {
  type: "license" | "medical_card" | "insurance" | "other";
  name: string;
  documentNumber?: string;
  mimeType: string;
  content: string;
  issuedAt?: string;
  expiresAt?: string;
};

export const addDriverDocument = async ({
  driverId,
  document,
}: {
  driverId: string;
  document: DriverDocumentInput;
}): Promise<void> => {
  const response = await fetch(`/api/drivers/${driverId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Unable to upload document"));
  }
};

export const deleteDriverDocument = async ({
  driverId,
  documentId,
}: {
  driverId: string;
  documentId: string;
}): Promise<void> => {
  const response = await fetch(
    `/api/drivers/${driverId}/documents/${documentId}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(await readError(response, "Unable to delete document"));
  }
};

export type DriverVehicleInput = {
  unitNumber: string;
  type: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  odometerMiles?: number;
  status: "active" | "maintenance" | "inactive";
  lastServiceAt?: string;
  imageMimeType?: "image/jpeg" | "image/png" | "image/webp";
  imageContent?: string;
};

export const saveDriverVehicle = async ({
  driverId,
  vehicle,
}: {
  driverId: string;
  vehicle: DriverVehicleInput;
}): Promise<void> => {
  const response = await fetch(`/api/drivers/${driverId}/vehicle`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehicle),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Unable to save truck"));
  }
};
