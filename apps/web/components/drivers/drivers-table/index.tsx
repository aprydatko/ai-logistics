"use client";

import * as React from "react";

import { Checkbox } from "@repo/ui/components/checkbox";
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

import { DriverProfilePanel } from "../driver-profile-panel";
import { DriverFormDialog } from "../driver-form-dialog";
import { DriversToolbar } from "../drivers-toolbar";
import { DriverRow } from "./driver-row";
import { DeleteDriverDialog } from "./delete-driver-dialog";
import { DriversPagination } from "./drivers-pagination";
import { DriversTableSkeleton } from "./drivers-table-skeleton";
import { useDriversTable } from "./use-drivers-table";

const DriversTableState = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => (
  <TableRow>
    <TableCell className="py-10 text-center" colSpan={7}>
      {children}
    </TableCell>
  </TableRow>
);

export const DriversTable = (): React.JSX.Element => {
  const table = useDriversTable();
  const [formDriver, setFormDriver] = React.useState<
    import("@/lib/drivers/drivers-query").DriversApiItem | null
  >(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [deleteDriver, setDeleteDriver] = React.useState<
    import("../types").DriverRow | null
  >(null);

  const openCreateForm = (): void => {
    setFormDriver(null);
    setIsFormOpen(true);
  };

  const openEditForm = (driver: import("../types").DriverRow): void => {
    if (!driver.source) {
      return;
    }

    setFormDriver(driver.source);
    setIsFormOpen(true);
  };

  return (
    <section className="flex h-[calc(100svh-7rem)] gap-5 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-hidden">
        <DriversToolbar
          filters={table.filters}
          onCreateDriver={openCreateForm}
          onActivityChange={(isActive) => {
            table.updateFilters({ isActive });
          }}
          onReset={table.resetFilters}
          onSearchChange={(search) => {
            table.updateFilters({ search });
          }}
          onStatusChange={(status) => {
            table.updateFilters({ status });
          }}
        />

        <DataTable className="flex min-h-0 flex-1 flex-col">
          <TableScrollArea className="min-h-0 flex-1 overflow-auto">
            <Table className="table-fixed">
              <colgroup>
                <col className="w-10" />
                <col className="w-[24%]" />
                <col className="w-[15%]" />
                <col className="w-[18%]" />
                <col className="w-[22%]" />
                <col className="w-[13%]" />
                <col className="w-16" />
              </colgroup>
              <TableHeader className="sticky top-0 z-10">
                <tr>
                  <TableHead className="w-8 text-center">
                    <span className="sr-only">Select</span>
                    <span className="inline-flex align-middle">
                      <Checkbox
                        aria-label="Select all drivers"
                        checked={
                          table.isPartiallySelected
                            ? "indeterminate"
                            : table.isAllSelected
                        }
                        onCheckedChange={(checked) => {
                          table.selectAll(checked === true);
                        }}
                      />
                    </span>
                  </TableHead>
                  <TableHead className="truncate">Name</TableHead>
                  <TableHead className="truncate">Status</TableHead>
                  <TableHead className="truncate">Truck</TableHead>
                  <TableHead className="truncate">Current load</TableHead>
                  <TableHead className="truncate">ETA</TableHead>
                  <TableHead className="w-16">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {table.driversQuery.isPending ? (
                  <DriversTableSkeleton />
                ) : null}
                {table.driversQuery.isError ? (
                  <DriversTableState>
                    Unable to load drivers. Please try again.
                  </DriversTableState>
                ) : null}
                {table.driversQuery.isSuccess && table.drivers.length === 0 ? (
                  <DriversTableState>No drivers found.</DriversTableState>
                ) : null}
                {table.drivers.map((driver) => (
                  <DriverRow
                    driver={driver}
                    isSelected={table.selectedDriverIds.has(driver.id)}
                    key={driver.id}
                    onDelete={setDeleteDriver}
                    onEdit={openEditForm}
                    onOpenProfile={table.setProfileDriver}
                    onSelectChange={table.selectDriver}
                  />
                ))}
              </TableBody>
            </Table>
          </TableScrollArea>
          <DriversPagination
            filters={table.filters}
            onPageChange={(page) => {
              table.updateFilters({ page });
            }}
            onPageSizeChange={(limit) => {
              table.updateFilters({ limit });
            }}
            totalItems={table.pagination?.total ?? 0}
            totalPages={Math.max(
              1,
              table.pagination?.totalPages ?? 1,
            )}
          />
        </DataTable>
      </div>
      <DriverProfilePanel
        driver={table.profileDriver}
        isOpen={table.profileDriver !== null}
        onClose={() => {
          table.setProfileDriver(null);
        }}
        onEdit={openEditForm}
      />
      <DriverFormDialog
        driver={formDriver}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
      <DeleteDriverDialog
        driver={deleteDriver}
        onOpenChange={(open) => {
          if (!open) setDeleteDriver(null);
        }}
      />
    </section>
  );
};
