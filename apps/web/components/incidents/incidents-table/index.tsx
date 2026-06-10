"use client";

import * as React from "react";

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

import { IncidentsToolbar } from "../incidents-toolbar";
import { IncidentDetailPanel } from "../incident-detail-panel";
import { IncidentsFormDialog } from "../incidents-form-dialog";
import type { IncidentFormValues } from "../incidents-form-dialog/form-values";
import { mockIncidents } from "../mock-incidents";
import type { Incident, IncidentFilters } from "../types";
import { IncidentRow } from "./incident-row";

const initialFilters: IncidentFilters = {
  search: "",
  priority: "all",
  status: "all",
  date: "all",
};

export const IncidentsTable = (): React.JSX.Element => {
  const [filters, setFilters] = React.useState(initialFilters);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = React.useState(10);
  const [detailIncident, setDetailIncident] = React.useState<Incident | null>(
    null,
  );
  const [incidentItems, setIncidentItems] =
    React.useState<Incident[]>(mockIncidents);
  const [formIncident, setFormIncident] = React.useState<Incident | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const incidents = incidentItems.filter((incident) => {
    const search = filters.search.toLowerCase();
    const matchesSearch =
      `${incident.title} ${incident.location} ${incident.driver?.name ?? ""} ${incident.load ?? ""}`
        .toLowerCase()
        .includes(search);
    const matchesPriority =
      filters.priority === "all" || incident.priority === filters.priority;
    const matchesStatus =
      filters.status === "all" || incident.status === filters.status;
    const dateValue = incident.occurredAt.primary.toLowerCase();
    const matchesDate =
      filters.date === "all" ||
      (filters.date === "today" &&
        !dateValue.includes("yesterday") &&
        !dateValue.includes("may 27")) ||
      (filters.date === "yesterday" && dateValue.includes("yesterday")) ||
      (filters.date === "older" && dateValue.includes("may 27"));
    return matchesSearch && matchesPriority && matchesStatus && matchesDate;
  });

  const allSelected =
    incidents.length > 0 && incidents.every(({ id }) => selectedIds.has(id));
  const partiallySelected =
    incidents.some(({ id }) => selectedIds.has(id)) && !allSelected;

  const selectAll = (checked: boolean): void => {
    setSelectedIds(
      checked ? new Set(incidents.map(({ id }) => id)) : new Set(),
    );
  };

  const selectIncident = (id: string, checked: boolean): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const saveIncident = (
    values: IncidentFormValues,
    incidentId?: string,
  ): void => {
    const occurredAt = values.occurredAt
      ? new Date(values.occurredAt)
      : new Date();
    const incident: Incident = {
      id: incidentId ?? `INC-${Date.now().toString().slice(-5)}`,
      title: values.type === "Accident" ? "Accident detected" : values.type,
      location: values.location,
      priority: values.priority,
      status: values.status,
      driver: values.driver
        ? { name: values.driver, truck: "Unassigned", avatarUrl: "" }
        : null,
      load: values.load || null,
      occurredAt: {
        primary: occurredAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        secondary: occurredAt.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
      },
      updatedAt: "Just now",
    };

    setIncidentItems((current) =>
      incidentId
        ? current.map((item) => (item.id === incidentId ? incident : item))
        : [incident, ...current],
    );
    setDetailIncident((current) =>
      current?.id === incidentId ? incident : current,
    );
  };

  return (
    <section className="flex h-[calc(100svh-7rem)] gap-5 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-hidden">
        <IncidentsToolbar
          filters={filters}
          onChange={(next) =>
            setFilters((current) => ({ ...current, ...next }))
          }
          onReport={() => {
            setFormIncident(null);
            setIsFormOpen(true);
          }}
          onReset={() => setFilters(initialFilters)}
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
                      onCheckedChange={(checked) => selectAll(checked === true)}
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
                    <TableHead className="truncate" key={heading}>
                      {heading}
                    </TableHead>
                  ))}
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-10 text-center" colSpan={9}>
                      No incidents found.
                    </TableCell>
                  </TableRow>
                ) : (
                  incidents.map((incident) => (
                    <IncidentRow
                      incident={incident}
                      isSelected={selectedIds.has(incident.id)}
                      key={incident.id}
                      onEdit={(item) => {
                        setFormIncident(item);
                        setIsFormOpen(true);
                      }}
                      onOpenDetail={setDetailIncident}
                      onSelectChange={selectIncident}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableScrollArea>
          <DataPagination
            ariaLabel="Incidents pagination"
            currentPage={1}
            endItem={incidents.length}
            itemName="incidents"
            onPageChange={() => undefined}
            onPageSizeChange={setPageSize}
            pages={[1]}
            pageSize={pageSize}
            pageSizeOptions={[10, 15, 20]}
            startItem={incidents.length === 0 ? 0 : 1}
            totalItems={incidents.length}
            totalPages={1}
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
        onDelete={(incidentId) => {
          setIncidentItems((current) =>
            current.filter(({ id }) => id !== incidentId),
          );
          if (detailIncident?.id === incidentId) setDetailIncident(null);
        }}
        onOpenChange={setIsFormOpen}
        onSave={saveIncident}
      />
    </section>
  );
};
