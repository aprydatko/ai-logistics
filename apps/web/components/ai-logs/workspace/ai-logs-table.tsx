import { Bot, Monitor, MoreHorizontal, Smartphone } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { DataPagination } from "@repo/ui/components/pagination";
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

import type { AiLog } from "../ai-logs-data";

type Props = {
  endItem: number;
  error: string | null;
  isLoading: boolean;
  limit: number;
  logs: AiLog[];
  page: number;
  pages: Array<number | "ellipsis">;
  selected: AiLog | null;
  setLimit: (nextLimit: number) => void;
  setPage: (nextPage: number) => void;
  setSelected: (log: AiLog | null) => void;
  startItem: number;
  totalItems: number;
  totalPages: number;
};

export const AiLogsTable = ({
  endItem,
  error,
  isLoading,
  limit,
  logs,
  page,
  pages,
  selected,
  setLimit,
  setPage,
  setSelected,
  startItem,
  totalItems,
  totalPages,
}: Props): React.JSX.Element => (
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
          {logs.length === 0 ? (
            <TableRow>
              <TableCell className="h-28 text-center text-ink-500" colSpan={11}>
                {isLoading
                  ? "Loading logs..."
                  : (error ?? "No logs match the selected filters.")}
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
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
      currentPage={page}
      endItem={endItem}
      itemName="logs"
      onPageChange={setPage}
      onPageSizeChange={setLimit}
      pages={pages}
      pageSize={limit}
      pageSizeOptions={[10, 15, 20]}
      startItem={startItem}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  </DataTable>
);
