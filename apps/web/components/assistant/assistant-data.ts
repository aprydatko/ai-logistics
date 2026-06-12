import {
  CloudRain,
  FileText,
  Route,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";

export type Priority = "High" | "Low" | "Medium";

export type DelayedLoad = {
  delay: string;
  driver: string;
  driverId: string;
  driverInitials: string;
  id: string;
  priority: Priority;
  reason: string;
  route: string;
};

export type SuggestedAction = {
  action: string;
  description: string;
  icon: LucideIcon;
  title: string;
  tone: "amber" | "blue" | "teal" | "violet";
};

export const delayedLoads: DelayedLoad[] = [
  {
    delay: "5h 42m",
    driver: "Sarah Davis",
    driverId: "TR-1022",
    driverInitials: "SD",
    id: "LD-10456",
    priority: "High",
    reason: "Traffic congestion",
    route: "Dallas, TX → Houston, TX",
  },
  {
    delay: "3h 18m",
    driver: "John Smith",
    driverId: "TR-1042",
    driverInitials: "JS",
    id: "LD-78291",
    priority: "High",
    reason: "Accident on I-94",
    route: "Chicago, IL → Detroit, MI",
  },
  {
    delay: "2h 07m",
    driver: "Michael Wilson",
    driverId: "TR-1066",
    driverInitials: "MW",
    id: "LD-2156",
    priority: "Medium",
    reason: "Severe storms",
    route: "Atlanta, GA → Miami, FL",
  },
  {
    delay: "1h 26m",
    driver: "David Lee",
    driverId: "TR-1008",
    driverInitials: "DL",
    id: "LD-9901",
    priority: "Low",
    reason: "Dock appointment",
    route: "Los Angeles, CA → Phoenix, AZ",
  },
  {
    delay: "55m",
    driver: "Emily Taylor",
    driverId: "TR-1011",
    driverInitials: "ET",
    id: "LD-1011",
    priority: "Low",
    reason: "Driver availability",
    route: "Seattle, WA → Portland, OR",
  },
];

export const suggestedActions: SuggestedAction[] = [
  {
    action: "Review",
    description: "Sarah Davis is 1h behind schedule",
    icon: UserRoundCheck,
    title: "Reassign driver for LD-10456",
    tone: "teal",
  },
  {
    action: "View route",
    description: "Alternative route can save ~45 min",
    icon: Route,
    title: "Reroute LD-78291 around I-94",
    tone: "amber",
  },
  {
    action: "Open on map",
    description: "Severe storms expected in Atlanta area",
    icon: CloudRain,
    title: "Weather impact on 2 loads",
    tone: "blue",
  },
  {
    action: "Generate report",
    description: "Summary for May 27, 2025 Midwest region",
    icon: FileText,
    title: "Generate delay report",
    tone: "violet",
  },
];
