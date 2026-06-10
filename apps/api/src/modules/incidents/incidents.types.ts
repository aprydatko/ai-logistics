import type { IncidentRecord } from "../../db/schema";

type IncidentBaseItem = Omit<
  IncidentRecord,
  "createdAt" | "occurredAt" | "resolvedAt" | "updatedAt"
> & {
  createdAt: string;
  occurredAt: string;
  resolvedAt: string | null;
  updatedAt: string;
};

export type IncidentLoadSummary = {
  id: string;
  referenceNumber: string;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    truckNumber: string | null;
  } | null;
};

export type IncidentItem = IncidentBaseItem & {
  load: IncidentLoadSummary;
};

export type IncidentsListResponse = {
  success: true;
  data: IncidentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type IncidentResponse = { success: true; data: IncidentItem };
