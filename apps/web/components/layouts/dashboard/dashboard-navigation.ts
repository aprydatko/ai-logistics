import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bot,
  FileText,
  Home,
  MessageSquareText,
  Settings,
  ShieldAlert,
  Truck,
  UserRound,
} from "lucide-react";

export type DashboardNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const dashboardNavigationItems: DashboardNavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/drivers", label: "Drivers", icon: UserRound },
  { href: "/loads", label: "Loads", icon: Truck },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/ai-logs", label: "AI Logs", icon: MessageSquareText },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];
