import { loadSchema, type LoadApiItem } from "./loads-query";
import type { LoadFormValues } from "./load-form-schema";

const readError = async (
  response: Response,
  fallback: string,
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
  return fallback;
};

const parseLoadResponse = async (response: Response): Promise<LoadApiItem> => {
  const body: unknown = await response.json();
  const data =
    body && typeof body === "object" && "data" in body ? body.data : body;
  return loadSchema.parse(data);
};

export const saveLoad = async ({
  loadId,
  values,
}: {
  loadId?: string;
  values: LoadFormValues;
}): Promise<LoadApiItem> => {
  const response = await fetch(loadId ? `/api/loads/${loadId}` : "/api/loads", {
    method: loadId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      referenceNumber: values.referenceNumber,
      pickupAddress: values.pickupAddress,
      deliveryAddress: values.deliveryAddress,
      pickupDate: new Date(values.pickupDate).toISOString(),
      deliveryDate: new Date(values.deliveryDate).toISOString(),
      weight: values.weight,
      price: values.price,
      miles: values.miles,
      notes: values.notes || undefined,
      status: values.status,
      broker: {
        id: values.brokerId,
        companyName: values.brokerCompanyName,
        phone: values.brokerPhone,
      },
      routePoints: values.routePoints,
      timeline: values.timeline.map((event) => ({
        ...event,
        dateTime: new Date(event.dateTime).toISOString(),
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Unable to save load"));
  }
  return parseLoadResponse(response);
};

export const assignLoadDriver = async ({
  loadId,
  driverId,
  averageSpeedMph,
}: {
  loadId: string;
  driverId: string;
  averageSpeedMph: number;
}): Promise<LoadApiItem> => {
  const response = await fetch(`/api/loads/${loadId}/assign-driver`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId, averageSpeedMph }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Unable to assign driver"));
  }
  return parseLoadResponse(response);
};
