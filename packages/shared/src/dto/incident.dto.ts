import type {
  Incident,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
} from "../types/incident.js";

export type CreateIncidentDto = Pick<
  Incident,
  "description" | "loadId" | "occurredAt" | "priority" | "title" | "type"
> &
  Partial<Pick<Incident, "location" | "photos" | "status" | "timeline">>;

export type UpdateIncidentDto = Partial<CreateIncidentDto>;

export type UpdateIncidentStatusDto = {
  status: IncidentStatus;
};

export type UpdateIncidentTimelineDto = {
  timeline: Incident["timeline"];
};

export type ListIncidentsQueryDto = {
  search?: string;
  type?: IncidentType;
  priority?: IncidentPriority;
  status?: IncidentStatus;
  loadId?: string;
  driverId?: string;
  occurredFrom?: string;
  occurredTo?: string;
  sortBy?: "createdAt" | "occurredAt" | "priority" | "title" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};
