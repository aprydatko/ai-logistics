"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import {
  incidentsQueryOptions,
  type IncidentsFilters,
} from "@/lib/incidents/incidents-query";
import { Checkbox } from "@repo/ui/components/checkbox";
import { DataPagination } from "@repo/ui/components/pagination";
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

import { IncidentDetailPanel } from "../incident-detail-panel";
import { IncidentsFormDialog } from "../incidents-form-dialog";
import { IncidentsToolbar } from "../incidents-toolbar";
import type { Incident } from "../types";
import { IncidentRow } from "./incident-row";
import { IncidentsTableSkeleton } from "./incidents-table-skeleton";

const DEFAULT_FILTERS: IncidentsFilters = {
  search: "",
  priority: "all",
  status: "all",
  occurredFrom: "",
  occurredTo: "",
  page: 1,
  limit: 10,
};

const getPages = (
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> => {
  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (page) =>
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );
  return pages.flatMap((page, index) => {
    const previous = pages[index - 1];
    return previous && page - previous > 1
      ? ["ellipsis" as const, page]
      : [page];
  });
};

export const IncidentsTable = (): React.JSX.Element => {
  const [filters, setFilters] = React.useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [detailIncident, setDetailIncident] = React.useState<Incident | null>(
    null,
  );
  const [formIncident, setFormIncident] = React.useState<Incident | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  React.useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(filters.search.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  const queryFilters = React.useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [debouncedSearch, filters],
  );
  const incidentsQuery = useQuery(incidentsQueryOptions(queryFilters));
  const incidents = React.useMemo(
    () => incidentsQuery.data?.data ?? [],
    [incidentsQuery.data],
  );
  const pagination = incidentsQuery.data?.pagination;

  React.useEffect(() => {
    if (!detailIncident) return;
    const refreshed = incidents.find(({ id }) => id === detailIncident.id);
    if (refreshed && refreshed !== detailIncident) setDetailIncident(refreshed);
  }, [detailIncident, incidents]);

  const updateFilters = (updates: Partial<IncidentsFilters>): void => {
    setFilters((current) => ({
      ...current,
      ...updates,
      page: updates.page ?? 1,
    }));
    setSelectedIds(new Set());
  };
  const allSelected =
    incidents.length > 0 && incidents.every(({ id }) => selectedIds.has(id));
  const partiallySelected =
    !allSelected && incidents.some(({ id }) => selectedIds.has(id));

  return (
    <section className="flex h-[calc(100svh-7rem)] gap-5 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-hidden">
        <IncidentsToolbar
          filters={filters}
          onChange={updateFilters}
          onReport={() => {
            setFormIncident(null);
            setIsFormOpen(true);
          }}
          onReset={() => {
            setFilters(DEFAULT_FILTERS);
            setDebouncedSearch("");
          }}
        />
        <DataTable className="flex min-h-0 flex-1 flex-col">
          <TableScrollArea className="min-h-0 flex-1 overflow-auto">
            <Table className="min-w-[980px] table-fixed">
              <colgroup>
                <col className="w-10" />
                <col className="w-[19%]" />
                <col className="w-[11%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-14" />
              </colgroup>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-center">
                    <Checkbox
                      aria-label="Select all incidents"
                      checked={
                        partiallySelected ? "indeterminate" : allSelected
                      }
                      onCheckedChange={(checked) =>
                        setSelectedIds(
                          checked === true
                            ? new Set(incidents.map(({ id }) => id))
                            : new Set(),
                        )
                      }
                    />
                  </TableHead>
                  {[
                    "Incident",
                    "Priority",
                    "Status",
                    "Driver",
                    "Load",
                    "Time",
                    "Updated",
                  ].map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidentsQuery.isPending ? <IncidentsTableSkeleton /> : null}
                {incidentsQuery.isError ? (
                  <TableRow>
                    <TableCell className="py-12 text-center" colSpan={9}>
                      Unable to load incidents. Please try again.
                    </TableCell>
                  </TableRow>
                ) : null}
                {incidentsQuery.isSuccess && incidents.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-12 text-center" colSpan={9}>
                      No incidents found.
                    </TableCell>
                  </TableRow>
                ) : null}
                {incidents.map((incident) => (
                  <IncidentRow
                    incident={incident}
                    isSelected={selectedIds.has(incident.id)}
                    key={incident.id}
                    onEdit={(item) => {
                      setFormIncident(item);
                      setIsFormOpen(true);
                    }}
                    onOpenDetail={setDetailIncident}
                    onSelectChange={(id, checked) =>
                      setSelectedIds((current) => {
                        const next = new Set(current);
                        if (checked) next.add(id);
                        else next.delete(id);
                        return next;
                      })
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </TableScrollArea>
          <DataPagination
            ariaLabel="Incidents pagination"
            currentPage={filters.page}
            endItem={Math.min(
              filters.page * filters.limit,
              pagination?.total ?? 0,
            )}
            itemName="incidents"
            onPageChange={(page) => updateFilters({ page })}
            onPageSizeChange={(limit) => updateFilters({ limit })}
            pages={getPages(
              filters.page,
              Math.max(1, pagination?.totalPages ?? 1),
            )}
            pageSize={filters.limit}
            pageSizeOptions={[10, 15, 20]}
            startItem={
              pagination?.total ? (filters.page - 1) * filters.limit + 1 : 0
            }
            totalItems={pagination?.total ?? 0}
            totalPages={Math.max(1, pagination?.totalPages ?? 1)}
          />
        </DataTable>
      </div>
      <IncidentDetailPanel
        incident={detailIncident}
        isOpen={detailIncident !== null}
        onClose={() => setDetailIncident(null)}
      />
      <IncidentsFormDialog
        incident={formIncident}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </section>
  );
};
