import type { LoadFormValues } from "@/lib/loads/load-form-schema";

import type { Load } from "../types";

export const emptyLoadFormValues: LoadFormValues = {
  cargo: "",
  contact: "",
  customer: "",
  destination: "",
  distance: "",
  driverName: "",
  eta: "",
  id: "",
  notes: "",
  origin: "",
  priority: "Medium",
  reference: "",
  routePoints: [
    { label: "Chicago, IL", latitude: 41.8781, longitude: -87.6298 },
    { label: "Detroit, MI", latitude: 42.3314, longitude: -83.0458 },
  ],
  status: "Pending",
  temperature: "N/A",
  timeline: [],
  truckId: "",
  truckModel: "",
  weight: "",
};

const monthNumbers: Record<string, string> = {
  Apr: "04",
  Aug: "08",
  Dec: "12",
  Feb: "02",
  Jan: "01",
  Jul: "07",
  Jun: "06",
  Mar: "03",
  May: "05",
  Nov: "11",
  Oct: "10",
  Sep: "09",
};

export const toLoadFormValues = (load: Load | null): LoadFormValues => {
  if (!load) return emptyLoadFormValues;

  const eta = load.eta
    ? `2026-${monthNumbers[load.eta.date.slice(0, 3)] ?? "05"}-${load.eta.date.slice(-2).padStart(2, "0")}T${load.eta.time}`
    : "";

  return {
    cargo: load.description,
    contact: load.details.contact,
    customer: load.details.customer,
    destination: load.route.destination,
    distance: load.details.distance,
    driverName: load.driver?.name ?? "",
    eta,
    id: load.id,
    notes: load.details.notes,
    origin: load.route.origin,
    priority: load.priority ?? "Medium",
    reference: load.details.reference,
    routePoints: load.routePoints,
    status: load.status,
    temperature: load.details.temperature,
    timeline: load.timeline,
    truckId: load.driver?.truckId ?? "",
    truckModel: load.details.truckModel ?? "",
    weight: load.details.weight,
  };
};

export const toLoad = (
  values: LoadFormValues,
  currentLoad: Load | null,
): Load => {
  const etaDate = new Date(values.eta);
  const eta = {
    date: etaDate.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
    }),
    time: etaDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
    }),
  };
  const route = values.routePoints.map(
    (point) => [point.longitude, point.latitude] as [number, number],
  );

  return {
    id: values.id,
    description: values.cargo,
    status: values.status,
    priority: values.priority,
    driver:
      values.driverName && values.truckId
        ? { name: values.driverName, truckId: values.truckId }
        : null,
    route: { destination: values.destination, origin: values.origin },
    eta,
    details: {
      contact: values.contact || "N/A",
      created:
        currentLoad?.details.created ??
        new Date().toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      customer: values.customer,
      distance: values.distance,
      notes: values.notes,
      reference: values.reference || "N/A",
      temperature: values.temperature || "N/A",
      truckModel: values.truckModel || null,
      weight: values.weight,
    },
    map: {
      center: route[0] ?? [-87.2, 42.3],
      route,
    },
    schedule: {
      destination: `${eta.date}, ${eta.time}`,
      origin: currentLoad?.schedule.origin ?? "Departure not set",
    },
    routePoints: values.routePoints,
    timeline: values.timeline,
  };
};
