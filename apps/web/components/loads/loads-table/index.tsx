"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  loadsQueryOptions,
  type LoadApiItem,
  type LoadsFilters,
} from "@/lib/loads/loads-query";
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

import { AssignDriverDialog } from "../assign-driver-dialog";
import { LoadDetailPanel } from "../load-detail-panel";
import { LoadFormDialog } from "../load-form-dialog";
import { LoadsToolbar } from "../loads-toolbar";
import { LoadRow } from "./load-row";
import { LoadsTableSkeleton } from "./loads-table-skeleton";

const DEFAULT_FILTERS: LoadsFilters = {
  search: "",
  status: "all",
  pickupFrom: "",
  pickupTo: "",
  page: 1,
  limit: 10,
};

const getPages = (
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> => {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) =>
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );
  return pages.flatMap((page, index) => {
    const previous = pages[index - 1];
    return previous && page - previous > 1 ? ["ellipsis" as const, page] : [page];
  });
};

export const LoadsTable = (): React.JSX.Element => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [detailLoad, setDetailLoad] = useState<LoadApiItem | null>(null);
  const [formLoad, setFormLoad] = useState<LoadApiItem | null>(null);
  const [assignLoad, setAssignLoad] = useState<LoadApiItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(filters.search.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [debouncedSearch, filters],
  );
  const loadsQuery = useQuery(loadsQueryOptions(queryFilters));
  const loads = useMemo(() => loadsQuery.data?.data ?? [], [loadsQuery.data]);
  const pagination = loadsQuery.data?.pagination;
  const isAllSelected =
    loads.length > 0 && loads.every((load) => selectedIds.has(load.id));
  const isPartiallySelected =
    !isAllSelected && loads.some((load) => selectedIds.has(load.id));

  useEffect(() => {
    if (!detailLoad) return;
    const refreshedLoad = loads.find((load) => load.id === detailLoad.id);
    if (refreshedLoad && refreshedLoad !== detailLoad) {
      setDetailLoad(refreshedLoad);
    }
  }, [detailLoad, loads]);

  const updateFilters = (updates: Partial<LoadsFilters>): void => {
    setFilters((current) => ({
      ...current,
      ...updates,
      page: updates.page ?? 1,
    }));
    setSelectedIds(new Set());
  };

  const openEdit = (load: LoadApiItem): void => {
    setFormLoad(load);
    setIsFormOpen(true);
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
            setFilters(DEFAULT_FILTERS);
            setDebouncedSearch("");
          }}
        />
        <DataTable className="flex min-h-0 flex-1 flex-col">
          <TableScrollArea className="min-h-0 flex-1 overflow-auto">
            <Table className="min-w-[1050px] table-fixed">
              <colgroup>
                <col className="w-10" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[17%]" />
                <col className="w-[24%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-14" />
              </colgroup>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-center">
                    <Checkbox
                      aria-label="Select all loads"
                      checked={isPartiallySelected ? "indeterminate" : isAllSelected}
                      onCheckedChange={(checked) =>
                        setSelectedIds(
                          checked === true
                            ? new Set(loads.map((load) => load.id))
                            : new Set(),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>Load</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Trip</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadsQuery.isPending ? <LoadsTableSkeleton /> : null}
                {loadsQuery.isError ? (
                  <TableRow>
                    <TableCell className="py-12 text-center" colSpan={8}>
                      Unable to load loads. Please try again.
                    </TableCell>
                  </TableRow>
                ) : null}
                {loadsQuery.isSuccess && loads.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-12 text-center" colSpan={8}>
                      No loads found.
                    </TableCell>
                  </TableRow>
                ) : null}
                {loads.map((load) => (
                  <LoadRow
                    isSelected={selectedIds.has(load.id)}
                    key={load.id}
                    load={load}
                    onAssign={setAssignLoad}
                    onEdit={openEdit}
                    onOpenDetails={setDetailLoad}
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
            ariaLabel="Loads pagination"
            currentPage={filters.page}
            endItem={Math.min(filters.page * filters.limit, pagination?.total ?? 0)}
            itemName="loads"
            onPageChange={(page) => updateFilters({ page })}
            onPageSizeChange={(limit) => updateFilters({ limit })}
            pages={getPages(filters.page, Math.max(1, pagination?.totalPages ?? 1))}
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
      <LoadDetailPanel
        load={detailLoad}
        onAssign={setAssignLoad}
        onClose={() => setDetailLoad(null)}
        onEdit={openEdit}
      />
      <LoadFormDialog
        isOpen={isFormOpen}
        load={formLoad}
        onOpenChange={setIsFormOpen}
      />
      <AssignDriverDialog
        load={assignLoad}
        onOpenChange={(open) => {
          if (!open) setAssignLoad(null);
        }}
      />
    </section>
  );
};
