import type { LoadFormValues } from "@/lib/loads/load-form-schema";
import type { LoadApiItem } from "@/lib/loads/loads-query";

const toLocalDateTime = (value: string): string => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const emptyLoadFormValues: LoadFormValues = {
  referenceNumber: "",
  status: "pending",
  pickupAddress: "",
  deliveryAddress: "",
  pickupDate: "",
  deliveryDate: "",
  weight: 1,
  price: 0,
  miles: 1,
  brokerId: "",
  brokerCompanyName: "",
  brokerPhone: "",
  notes: "",
  routePoints: [
    { label: "Pickup", latitude: 41.8781, longitude: -87.6298 },
    { label: "Delivery", latitude: 42.3314, longitude: -83.0458 },
  ],
  timeline: [],
};

export const toLoadFormValues = (
  load: LoadApiItem | null,
): LoadFormValues => {
  if (!load) return emptyLoadFormValues;

  return {
    referenceNumber: load.referenceNumber,
    status: load.status,
    pickupAddress: load.pickupAddress,
    deliveryAddress: load.deliveryAddress,
    pickupDate: toLocalDateTime(load.pickupDate),
    deliveryDate: toLocalDateTime(load.deliveryDate),
    weight: load.weight,
    price: load.price,
    miles: load.miles,
    brokerId: load.broker.id,
    brokerCompanyName: load.broker.companyName,
    brokerPhone: load.broker.phone,
    notes: load.notes ?? "",
    routePoints:
      load.routePoints.length >= 2
        ? load.routePoints
        : emptyLoadFormValues.routePoints,
    timeline: load.timeline.map((event) => ({
      ...event,
      dateTime: toLocalDateTime(event.dateTime),
    })),
  };
};
