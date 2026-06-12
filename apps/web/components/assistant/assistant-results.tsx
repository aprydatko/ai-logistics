import {
  AlertTriangle,
  Clock3,
  DollarSign,
  Sparkles,
  Truck,
} from "lucide-react";

import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@repo/ui/components/table";
import { cn } from "@repo/ui/lib/utils";

import { delayedLoads, type Priority } from "./assistant-data";

const metrics = [
  { icon: Truck, label: "Delayed loads", tone: "red", value: "6" },
  { icon: Clock3, label: "Total delay", tone: "teal", value: "18.4h" },
  { icon: DollarSign, label: "Est. extra cost", tone: "amber", value: "$7,420" },
  { icon: AlertTriangle, label: "High priority", tone: "red", value: "3" },
] as const;

const toneClasses = {
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  teal: "bg-teal-50 text-teal-700",
};

const priorityClasses: Record<Priority, string> = {
  High: "bg-red-50 text-red-600",
  Low: "bg-blue-50 text-blue-600",
  Medium: "bg-amber-50 text-amber-700",
};

export const AssistantResults = (): React.JSX.Element => (
  <section className="relative rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
    <span className="absolute -left-4 top-4 grid size-8 place-items-center rounded-full bg-ai-600 text-white shadow-md ring-4 ring-white">
      <Sparkles className="size-4" />
    </span>

    <h2 className="pl-2 text-sm font-bold text-ink-900">
      Found 6 delayed loads in the Midwest on May 27, 2025.
    </h2>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ icon: Icon, label, tone, value }) => (
        <article className="flex items-center gap-3 rounded-xl border border-border p-3" key={label}>
          <span className={cn("grid size-10 place-items-center rounded-xl", toneClasses[tone])}>
            <Icon className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold leading-5 text-ink-900">{value}</p>
            <p className="mt-1 text-xs text-primary-700">{label}</p>
          </div>
        </article>
      ))}
    </div>

    <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.08em] text-primary-700">
      Top delayed loads
    </h3>
    <DataTable className="shadow-none">
      <TableScrollArea>
        <Table className="min-w-[780px]">
          <TableHeader>
            <TableRow>
              <TableHead>Load</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Delay</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {delayedLoads.map((load) => (
              <TableRow key={load.id}>
                <TableCell>
                  <p className="text-xs font-bold text-ink-900">{load.id}</p>
                  <p className="mt-1 text-xs text-primary-700">{load.route}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-full bg-primary-700 text-[0.65rem] font-bold text-white">
                      {load.driverInitials}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-ink-900">{load.driver}</p>
                      <p className="mt-1 text-xs text-primary-700">{load.driverId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-bold text-amber-600">{load.delay}</TableCell>
                <TableCell className="text-xs text-ink-900">{load.reason}</TableCell>
                <TableCell>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", priorityClasses[load.priority])}>
                    {load.priority}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
    </DataTable>
  </section>
);
