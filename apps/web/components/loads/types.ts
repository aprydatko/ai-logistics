export type LoadStatus =
  | "In Transit"
  | "Delayed"
  | "Delivered"
  | "Pending"
  | "Assigned"
  | "Cancelled";

export type LoadPriority = "High" | "Medium" | "Low";

export type Load = {
  id: string;
  description: string;
  status: LoadStatus;
  driver: {
    name: string;
    truckId: string;
    avatarUrl?: string;
  } | null;
  route: {
    origin: string;
    destination: string;
  };
  eta: {
    date: string;
    time: string;
  } | null;
  priority: LoadPriority | null;
  details: {
    weight: string;
    customer: string;
    created: string;
    contact: string;
    reference: string;
    temperature: string;
    truckModel: string | null;
    distance: string;
  };
  schedule: {
    origin: string;
    destination: string;
  };
  map: {
    center: [number, number];
    route: Array<[number, number]>;
  };
};

export type LoadFilters = {
  search: string;
  status: LoadStatus | "all";
  date: "all" | "may-28" | "may-29-or-later";
  route: "all" | "midwest" | "south" | "west" | "northeast";
};
