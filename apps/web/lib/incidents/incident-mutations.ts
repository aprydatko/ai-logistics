import type { IncidentFormValues } from "@/components/incidents/incidents-form-dialog/form-values";

import {
  incidentSchema,
  type IncidentApiItem,
  type IncidentTimelineEvent,
} from "./incidents-query";

const readError = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  return body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
    ? body.message
    : fallback;
};

const parseIncident = async (response: Response): Promise<IncidentApiItem> => {
  const body: unknown = await response.json();
  const data =
    body && typeof body === "object" && "data" in body ? body.data : body;
  return incidentSchema.parse(data);
};

export const saveIncident = async ({
  incidentId,
  timeline,
  values,
}: {
  incidentId?: string;
  timeline: IncidentTimelineEvent[];
  values: IncidentFormValues;
}): Promise<IncidentApiItem> => {
  const response = await fetch(
    incidentId ? `/api/incidents/${incidentId}` : "/api/incidents",
    {
      method: incidentId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loadId: values.loadId,
        title: values.title,
        description: values.description,
        location: values.location || undefined,
        type: values.type,
        priority: values.priority,
        status: values.status,
        occurredAt: new Date(values.occurredAt).toISOString(),
        timeline,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to save incident"));
  }
  return parseIncident(response);
};

export const updateIncidentStatus = async ({
  incidentId,
  status,
}: {
  incidentId: string;
  status: IncidentApiItem["status"];
}): Promise<IncidentApiItem> => {
  const response = await fetch(`/api/incidents/${incidentId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to update status"));
  }
  return parseIncident(response);
};

export const updateIncidentTimeline = async ({
  incidentId,
  timeline,
}: {
  incidentId: string;
  timeline: IncidentTimelineEvent[];
}): Promise<IncidentApiItem> => {
  const response = await fetch(`/api/incidents/${incidentId}/timeline`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timeline }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to update timeline"));
  }
  return parseIncident(response);
};
