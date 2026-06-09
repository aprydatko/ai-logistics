import type { Load } from "./types";

type LoadSeed = Omit<
  Load,
  "details" | "schedule" | "map" | "routePoints" | "timeline"
> &
  Partial<
    Pick<Load, "details" | "schedule" | "map" | "routePoints" | "timeline">
  >;

const loadSeeds: LoadSeed[] = [
  {
    id: "LD-78291",
    description: "Equipment parts",
    status: "In Transit",
    driver: { name: "John Smith", truckId: "TR-1042" },
    route: { origin: "Chicago, IL", destination: "Detroit, MI" },
    eta: { date: "May 28", time: "14:30" },
    priority: "High",
  },
  {
    id: "LD-10456",
    description: "Retail goods",
    status: "Delayed",
    driver: { name: "Sarah Davis", truckId: "TR-1022" },
    route: { origin: "Dallas, TX", destination: "Houston, TX" },
    eta: { date: "May 27", time: "09:45" },
    priority: "Medium",
  },
  {
    id: "LD-2156",
    description: "Industrial parts",
    status: "In Transit",
    driver: { name: "Michael Wilson", truckId: "TR-1066" },
    route: { origin: "Atlanta, GA", destination: "Miami, FL" },
    eta: { date: "May 25", time: "16:20" },
    priority: "High",
  },
  {
    id: "LD-9901",
    description: "Food & beverages",
    status: "Delivered",
    driver: { name: "David Lee", truckId: "TR-1088" },
    route: { origin: "Los Angeles, CA", destination: "Phoenix, AZ" },
    eta: { date: "May 24", time: "17:05" },
    priority: "Low",
  },
  {
    id: "LD-1011",
    description: "Pharmaceuticals",
    status: "Pending",
    driver: { name: "Emily Taylor", truckId: "TR-1011" },
    route: { origin: "Seattle, WA", destination: "Portland, OR" },
    eta: { date: "May 29", time: "11:00" },
    priority: "Medium",
  },
  {
    id: "LD-78288",
    description: "Construction materials",
    status: "Assigned",
    driver: { name: "Robert Brown", truckId: "TR-1055" },
    route: { origin: "Denver, CO", destination: "Salt Lake City, UT" },
    eta: { date: "May 30", time: "13:15" },
    priority: "Low",
  },
  {
    id: "LD-3321",
    description: "Electronics",
    status: "Cancelled",
    driver: null,
    route: { origin: "Boston, MA", destination: "New York, NY" },
    eta: null,
    priority: null,
  },
  {
    id: "LD-5567",
    description: "Auto parts",
    status: "In Transit",
    driver: { name: "Maria Johnson", truckId: "TR-1009" },
    route: { origin: "St. Louis, MO", destination: "Kansas City, MO" },
    eta: { date: "May 28", time: "15:45" },
    priority: "Medium",
  },
  {
    id: "LD-6412",
    description: "Medical supplies",
    status: "Pending",
    driver: null,
    route: { origin: "Austin, TX", destination: "New Orleans, LA" },
    eta: { date: "Jun 01", time: "08:20" },
    priority: "High",
  },
  {
    id: "LD-9084",
    description: "Office furniture",
    status: "Assigned",
    driver: { name: "Kevin Moore", truckId: "TR-1074" },
    route: { origin: "Columbus, OH", destination: "Pittsburgh, PA" },
    eta: { date: "Jun 02", time: "12:10" },
    priority: "Low",
  },
  {
    id: "LD-4470",
    description: "Fresh produce",
    status: "Delayed",
    driver: { name: "Olivia Clark", truckId: "TR-1031" },
    route: { origin: "Fresno, CA", destination: "Las Vegas, NV" },
    eta: { date: "Jun 03", time: "06:30" },
    priority: "High",
  },
  {
    id: "LD-7295",
    description: "Textiles",
    status: "Delivered",
    driver: { name: "Daniel Harris", truckId: "TR-1091" },
    route: { origin: "Charlotte, NC", destination: "Richmond, VA" },
    eta: { date: "May 26", time: "18:40" },
    priority: "Medium",
  },
];

const defaultMap: Load["map"] = {
  center: [-87.2, 42.3],
  route: [
    [-87.6298, 41.8781],
    [-86.7, 42.05],
    [-85.8, 42.1],
    [-84.9, 42.25],
    [-83.0458, 42.3314],
  ],
};

export const loads: Load[] = loadSeeds.map((load, index) => ({
  ...load,
  details: load.details ?? {
    contact: "+1 (312) 555-0198",
    created: "May 25, 2025, 09:15",
    customer: "Acme Industries",
    distance: index === 0 ? "283 mi" : "420 mi",
    notes: "",
    reference: `PO-${String(8921 + index).padStart(5, "0")}`,
    temperature: "N/A",
    truckModel: load.driver ? "Volvo VNL 860" : null,
    weight: "24,000 lbs",
  },
  map: load.map ?? defaultMap,
  schedule: load.schedule ?? {
    destination: load.eta ? `${load.eta.date}, ${load.eta.time}` : "Not set",
    origin: "May 26, 08:00",
  },
  routePoints: load.routePoints ?? [
    {
      label: load.route.origin,
      latitude: defaultMap.route[0]![1],
      longitude: defaultMap.route[0]![0],
    },
    {
      label: load.route.destination,
      latitude: defaultMap.route.at(-1)![1],
      longitude: defaultMap.route.at(-1)![0],
    },
  ],
  timeline: load.timeline ?? [
    {
      dateTime: "2026-05-25T09:15",
      description: "Load record created",
      title: "Load created",
    },
  ],
}));
