"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  CalendarDays,
  Filter,
  MoreHorizontal,
  Monitor,
  SlidersHorizontal,
  Smartphone,
} from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { DataPagination } from "@repo/ui/components/pagination";
import { SelectButton } from "@repo/ui/components/select-button";
import { SparklineChart } from "@repo/ui/components/sparkline-chart";
import { StatusBadge } from "@repo/ui/components/status-badge";
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

import { AiLogDetails } from "./ai-log-details";
import { aiLogs, metricData, type AiLog } from "./ai-logs-data";

const options = {
  model: [
    { label: "All models", value: "all" },
    { label: "GPT-4.1", value: "GPT-4.1" },
    { label: "GPT-3.5 Turbo", value: "GPT-3.5 Turbo" },
  ],
  status: [
    { label: "All statuses", value: "all" },
    { label: "Success", value: "Success" },
    { label: "Failed", value: "Failed" },
  ],
  operation: [
    { label: "All operations", value: "all" },
    ...Array.from(new Set(aiLogs.map(({ operation }) => operation))).map(
      (value) => ({ label: value, value }),
    ),
  ],
};

export const AiLogsWorkspace = (): React.JSX.Element => {
  const [model, setModel] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [operation, setOperation] = React.useState("all");
  const [selected, setSelected] = React.useState<AiLog | null>(
    aiLogs[0] ?? null,
  );
  const filtered = aiLogs.filter(
    (log) =>
      (model === "all" || log.model === model) &&
      (status === "all" || log.status === status) &&
      (operation === "all" || log.operation === operation),
  );

  return (
    <section className="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
      <header className="flex shrink-0 flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl leading-9 text-ink-900">AI Activity Logs</h1>
          <p className="text-sm text-primary-700">
            Overview of AI operations, model performance, usage, and errors.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-10 bg-card text-primary-700" variant="outline">
            <CalendarDays />
            May 24 – May 28, 2025
          </Button>
          <Button className="h-10 bg-card text-primary-700" variant="outline">
            <Filter />
            Filters{" "}
            <span className="rounded-full bg-primary-700 px-2 py-0.5 text-xs text-white">
              3
            </span>
          </Button>
        </div>
      </header>

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metricData.map((metric) => {
          const TrendIcon = metric.direction === "up" ? ArrowUp : ArrowDown;
          return (
            <article
              className="rounded-xl border border-border bg-card p-4 shadow-xs"
              key={metric.title}
            >
              <p className="text-xs font-semibold text-ink-500">
                {metric.title}
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    {metric.value}
                  </p>
                  <p
                    className={
                      metric.favorable
                        ? "mt-2 flex items-center text-xs font-semibold text-teal-600"
                        : "mt-2 flex items-center text-xs font-semibold text-danger"
                    }
                  >
                    <TrendIcon className="mr-1 size-3" />
                    {metric.change}{" "}
                    <span className="ml-1 font-normal text-ink-500">
                      vs yesterday
                    </span>
                  </p>
                </div>
                <SparklineChart
                  className="h-12 w-24"
                  color={metric.color}
                  data={[...metric.data]}
                  label={`${metric.title} trend`}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
        <label className="min-w-44 flex-1 text-xs font-semibold text-ink-500">
          Model
          <SelectButton
            className="mt-1 w-full"
            options={options.model}
            placeholder="Model"
            value={model}
            onValueChange={setModel}
          />
        </label>
        <label className="min-w-44 flex-1 text-xs font-semibold text-ink-500">
          Status
          <SelectButton
            className="mt-1 w-full"
            options={options.status}
            placeholder="Status"
            value={status}
            onValueChange={setStatus}
          />
        </label>
        <label className="min-w-48 flex-1 text-xs font-semibold text-ink-500">
          Operation
          <SelectButton
            className="mt-1 w-full"
            options={options.operation}
            placeholder="Operation"
            value={operation}
            onValueChange={setOperation}
          />
        </label>
        <Button
          className="h-11 min-w-40 justify-between bg-card text-primary-700"
          variant="outline"
        >
          <CalendarDays />
          May 24 – May 28
        </Button>
        <Button
          className="h-11 min-w-36 bg-card text-primary-700"
          variant="outline"
        >
          <SlidersHorizontal />
          More filters
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden xl:flex-row">
        <DataTable className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TableScrollArea className="min-h-0 flex-1 overflow-auto">
            <Table className="min-w-[1120px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Linked to</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="h-28 text-center text-ink-500"
                      colSpan={11}
                    >
                      No logs match the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((log) => (
                    <TableRow
                      className="cursor-pointer"
                      isSelected={selected?.id === log.id}
                      key={log.id}
                      onClick={() => setSelected(log)}
                    >
                      <TableCell className="text-xs font-medium text-primary-700">
                        {log.time}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2 font-semibold">
                          <span className="grid size-7 place-items-center rounded-md bg-ai-background text-ai">
                            <Bot className="size-4" />
                          </span>
                          {log.operation}
                        </span>
                      </TableCell>
                      <TableCell>{log.model}</TableCell>
                      <TableCell>
                        <StatusBadge
                          size="sm"
                          tone={log.status === "Success" ? "success" : "danger"}
                        >
                          {log.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{log.latency}</TableCell>
                      <TableCell>{log.tokens}</TableCell>
                      <TableCell>{log.cost}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="grid size-7 place-items-center rounded-full bg-primary-700 text-[0.65rem] font-bold text-white">
                            {log.initials}
                          </span>
                          {log.user}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          {log.source === "Web" ? (
                            <Monitor className="size-4" />
                          ) : (
                            <Smartphone className="size-4" />
                          )}
                          {log.source}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-info">
                        {log.linkedType} {log.linkedId}
                      </TableCell>
                      <TableCell>
                        <Button
                          aria-label={`Actions for ${log.id}`}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <MoreHorizontal />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableScrollArea>
          <DataPagination
            ariaLabel="AI logs pagination"
            className="shrink-0"
            currentPage={1}
            endItem={filtered.length}
            itemName="logs"
            pageSize={10}
            startItem={filtered.length ? 1 : 0}
            totalItems={filtered.length ? 2143 : 0}
            totalPages={filtered.length ? 215 : 1}
          />
        </DataTable>
        {selected ? (
          <AiLogDetails log={selected} onClose={() => setSelected(null)} />
        ) : null}
      </div>
    </section>
  );
};
