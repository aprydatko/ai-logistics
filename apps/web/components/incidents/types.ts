export type IncidentPriority = "High" | "Medium" | "Low";

export type IncidentStatus =
  | "Open"
  | "Investigating"
  | "Monitoring"
  | "Resolved"
  | "Closed";

export type Incident = {
  id: string;
  title: string;
  location: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  driver: {
    name: string;
    truck: string;
    avatarUrl: string;
  } | null;
  load: string | null;
  occurredAt: {
    primary: string;
    secondary: string;
  };
  updatedAt: string;
};

export type IncidentFilters = {
  search: string;
  priority: IncidentPriority | "all";
  status: IncidentStatus | "all";
  date: "all" | "today" | "yesterday" | "older";
};
