"use client";

import { Clock3, Sparkles, Truck } from "lucide-react";

import type { AssistantLoadsTableResult } from "@repo/shared";
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

const toneClasses = {
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  teal: "bg-teal-50 text-teal-700",
};

const statusClasses: Record<string, string> = {
  assigned: "bg-blue-50 text-blue-700",
  cancelled: "bg-slate-100 text-slate-700",
  delivered: "bg-emerald-50 text-emerald-700",
  in_transit: "bg-amber-50 text-amber-700",
  pending: "bg-violet-50 text-violet-700",
};

type AssistantResultsProps = {
  result: AssistantLoadsTableResult;
};

export const AssistantResults = ({
  result,
}: AssistantResultsProps): React.JSX.Element => (
  <section className="relative rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
    <span className="absolute -left-4 top-4 grid size-8 place-items-center rounded-full bg-ai-600 text-white shadow-md ring-4 ring-white">
      <Sparkles className="size-4" />
    </span>

    <h2 className="pl-2 text-sm font-bold text-ink-900">{result.title}</h2>
    {result.summary ? (
      <p className="mt-2 pl-2 text-sm text-primary-700">{result.summary}</p>
    ) : null}

    {result.metrics.length > 0 ? (
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {result.metrics.map(({ label, tone, value }) => (
          <article
            className="flex items-center gap-3 rounded-xl border border-border p-3"
            key={label}
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-xl",
                toneClasses[tone],
              )}
            >
              {label.toLowerCase().includes("transit") ? (
                <Clock3 className="size-5" />
              ) : (
                <Truck className="size-5" />
              )}
            </span>
            <div>
              <p className="text-lg font-bold leading-5 text-ink-900">{value}</p>
              <p className="mt-1 text-xs text-primary-700">{label}</p>
            </div>
          </article>
        ))}
      </div>
    ) : null}

    <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.08em] text-primary-700">
      Matching loads
    </h3>
    <DataTable className="shadow-none">
      <TableScrollArea>
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow>
              <TableHead>Load</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Route</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((load) => (
              <TableRow key={load.id}>
                <TableCell>
                  <p className="text-xs font-bold text-ink-900">
                    {load.referenceNumber}
                  </p>
                  <p className="mt-1 text-xs text-primary-700">{load.id}</p>
                </TableCell>
                <TableCell>
                  {load.driverName ? (
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-full bg-primary-700 text-[0.65rem] font-bold text-white">
                        {load.driverInitials ?? "NA"}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-ink-900">
                          {load.driverName}
                        </p>
                        <p className="mt-1 text-xs text-primary-700">
                          {load.driverCode ?? "No truck assigned"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-primary-700">Unassigned</p>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      statusClasses[load.status] ?? "bg-surface-100 text-primary-700",
                    )}
                  >
                    {load.status.replaceAll("_", " ")}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-ink-900">
                  {formatDate(load.pickupDate)}
                </TableCell>
                <TableCell className="text-xs text-ink-900">
                  {formatDate(load.deliveryDate)}
                </TableCell>
                <TableCell className="text-xs text-ink-900">
                  {load.route}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
    </DataTable>
  </section>
);

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};
