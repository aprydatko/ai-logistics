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
import { toast } from "@repo/ui/components/toaster";

import { loads as initialLoads } from "../load-data";
import { LoadDetailPanel } from "../load-detail-panel";
import { LoadFormDialog } from "../load-form-dialog";
import { LoadsToolbar } from "../loads-toolbar";
import type { Load, LoadFilters } from "../types";
import { LoadRow } from "./load-row";

const initialFilters: LoadFilters = {
  search: "",
  status: "all",
  date: "all",
  route: "all",
};

const routeRegions: Record<Exclude<LoadFilters["route"], "all">, string[]> = {
  midwest: ["Chicago", "Detroit", "St. Louis", "Kansas City", "Columbus"],
  northeast: ["Boston", "New York", "Pittsburgh"],
  south: ["Dallas", "Houston", "Atlanta", "Miami", "Austin", "New Orleans"],
  west: ["Los Angeles", "Phoenix", "Seattle", "Portland", "Denver", "Fresno"],
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
    const previousPage = pages[index - 1];
    return previousPage && page - previousPage > 1
      ? ["ellipsis" as const, page]
      : [page];
  });
};

export const LoadsTable = (): React.JSX.Element => {
  const [loads, setLoads] = React.useState(initialLoads);
  const [filters, setFilters] = React.useState(initialFilters);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [profileLoad, setProfileLoad] = React.useState<Load | null>(null);
  const [formLoad, setFormLoad] = React.useState<Load | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const filteredLoads = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return loads.filter((load) => {
      const searchable = [
        load.id,
        load.description,
        load.driver?.name,
        load.driver?.truckId,
        load.route.origin,
        load.route.destination,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const routeCities =
        filters.route === "all" ? [] : routeRegions[filters.route];
      const etaDay = load.eta ? Number(load.eta.date.split(" ")[1]) : null;
      const matchesRoute =
        filters.route === "all" ||
        routeCities.some(
          (city) =>
            load.route.origin.includes(city) ||
            load.route.destination.includes(city),
        );
      const matchesDate =
        filters.date === "all" ||
        (filters.date === "may-28" && load.eta?.date === "May 28") ||
        (filters.date === "may-29-or-later" &&
          etaDay !== null &&
          (load.eta?.date.startsWith("Jun") || etaDay >= 29));

      return (
        (!search || searchable.includes(search)) &&
        (filters.status === "all" || load.status === filters.status) &&
        matchesRoute &&
        matchesDate
      );
    });
  }, [filters, loads]);

  const totalPages = Math.max(1, Math.ceil(filteredLoads.length / pageSize));
  const visibleLoads = filteredLoads.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const isAllSelected =
    visibleLoads.length > 0 &&
    visibleLoads.every((load) => selectedIds.has(load.id));
  const isPartiallySelected =
    !isAllSelected && visibleLoads.some((load) => selectedIds.has(load.id));

  const updateFilters = (nextFilters: Partial<LoadFilters>): void => {
    setFilters((current) => ({ ...current, ...nextFilters }));
    setPage(1);
  };

  const selectAll = (checked: boolean): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      visibleLoads.forEach((load) =>
        checked ? next.add(load.id) : next.delete(load.id),
      );
      return next;
    });
  };

  return (
    <section className="flex h-[calc(100svh-7rem)] gap-5 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-hidden">
        <LoadsToolbar
          filters={filters}
          onCreateLoad={() => {
            setFormLoad(null);
            setIsFormOpen(true);
          }}
          onFiltersChange={updateFilters}
          onReset={() => {
            setFilters(initialFilters);
            setPage(1);
          }}
        />
        <DataTable className="flex min-h-0 flex-1 flex-col">
          <TableScrollArea className="min-h-0 flex-1 overflow-auto">
            <Table className="min-w-[960px] table-fixed">
              <colgroup>
                <col className="w-10" />
                <col className="w-[17%]" />
                <col className="w-[13%]" />
                <col className="w-[20%]" />
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[11%]" />
                <col className="w-14" />
              </colgroup>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-center">
                    <Checkbox
                      aria-label="Select all loads"
                      checked={
                        isPartiallySelected ? "indeterminate" : isAllSelected
                      }
                      onCheckedChange={(checked) => selectAll(checked === true)}
                    />
                  </TableHead>
                  <TableHead>Load</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLoads.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-12 text-center" colSpan={8}>
                      No loads match the selected filters.
                    </TableCell>
                  </TableRow>
                ) : null}
                {visibleLoads.map((load) => (
                  <LoadRow
                    isSelected={selectedIds.has(load.id)}
                    key={load.id}
                    load={load}
                    onEdit={(selectedLoad) => {
                      setFormLoad(selectedLoad);
                      setIsFormOpen(true);
                    }}
                    onOpenDetails={setProfileLoad}
                    onSelectChange={(loadId, checked) => {
                      setSelectedIds((current) => {
                        const next = new Set(current);
                        if (checked) {
                          next.add(loadId);
                        } else {
                          next.delete(loadId);
                        }
                        return next;
                      });
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          </TableScrollArea>
          <DataPagination
            ariaLabel="Loads pagination"
            currentPage={page}
            endItem={Math.min(page * pageSize, filteredLoads.length)}
            itemName="loads"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            pages={getPages(page, totalPages)}
            pageSize={pageSize}
            pageSizeOptions={[8, 10, 20]}
            startItem={
              filteredLoads.length === 0 ? 0 : (page - 1) * pageSize + 1
            }
            totalItems={filteredLoads.length}
            totalPages={totalPages}
          />
        </DataTable>
      </div>
      <LoadDetailPanel
        load={profileLoad}
        onClose={() => setProfileLoad(null)}
        onEdit={(selectedLoad) => {
          setFormLoad(selectedLoad);
          setIsFormOpen(true);
        }}
      />
      <LoadFormDialog
        isOpen={isFormOpen}
        load={formLoad}
        onDelete={(loadId) => {
          setLoads((current) => current.filter((load) => load.id !== loadId));
          setProfileLoad((current) => (current?.id === loadId ? null : current));
          toast.success("Load deleted successfully");
        }}
        onOpenChange={setIsFormOpen}
        onSave={(savedLoad) => {
          const isEditing = loads.some((load) => load.id === savedLoad.id);
          setLoads((current) => {
            const existingIndex = current.findIndex(
              (load) => load.id === savedLoad.id,
            );
            if (existingIndex === -1) return [savedLoad, ...current];

            return current.map((load, index) =>
              index === existingIndex ? savedLoad : load,
            );
          });
          setProfileLoad((current) =>
            current?.id === savedLoad.id ? savedLoad : current,
          );
          toast.success(
            isEditing
              ? "Load updated successfully"
              : "Load created successfully",
          );
        }}
      />
    </section>
  );
};
