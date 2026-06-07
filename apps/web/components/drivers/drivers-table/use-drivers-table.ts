"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import {
  driversQueryOptions,
  type DriversApiItem,
  type DriversFilters,
} from "@/lib/drivers/drivers-query";

import type { DriverRow } from "../types";

const DEFAULT_FILTERS: DriversFilters = {
  search: "",
  status: "all",
  isActive: "all",
  page: 1,
  limit: 10,
};

const toDriverRow = (driver: DriversApiItem): DriverRow => ({
  id: driver.driverCode,
  name: `${driver.firstName} ${driver.lastName}`,
  avatarUrl: driver.avatarUrl ?? "",
  status:
    driver.status === "off_duty"
      ? "Off Duty"
      : driver.status === "maintenance"
        ? "Break"
        : "On Duty",
  truck: driver.truckNumber ? `Truck ${driver.truckNumber}` : "Unassigned",
  truckState:
    driver.status === "off_duty"
      ? "idle"
      : driver.status === "maintenance"
        ? "break"
        : "active",
  currentLoad: null,
  eta: { time: null },
  source: driver,
});

export const useDriversTable = () => {
  const [filters, setFilters] = React.useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedDriverIds, setSelectedDriverIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [profileDriver, setProfileDriver] = React.useState<DriverRow | null>(
    null,
  );

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [filters.search]);

  const queryFilters = React.useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [debouncedSearch, filters],
  );
  const driversQuery = useQuery(driversQueryOptions(queryFilters));
  const driversData = driversQuery.isError ? undefined : driversQuery.data;
  const drivers = React.useMemo(
    () => (driversData?.data ?? []).map(toDriverRow),
    [driversData],
  );
  const isAllSelected =
    drivers.length > 0 && selectedDriverIds.size === drivers.length;
  const isPartiallySelected = selectedDriverIds.size > 0 && !isAllSelected;

  const updateFilters = (updates: Partial<DriversFilters>): void => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...updates,
      page: updates.page ?? 1,
    }));
    setSelectedDriverIds(new Set());
  };

  const resetFilters = (): void => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch("");
    setSelectedDriverIds(new Set());
  };

  const selectAll = (checked: boolean): void => {
    setSelectedDriverIds(
      checked ? new Set(drivers.map((driver) => driver.id)) : new Set(),
    );
  };

  const selectDriver = (driverId: string, checked: boolean): void => {
    setSelectedDriverIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) nextIds.add(driverId);
      else nextIds.delete(driverId);

      return nextIds;
    });
  };

  return {
    drivers,
    driversQuery,
    filters,
    isAllSelected,
    isPartiallySelected,
    pagination: driversData?.pagination,
    profileDriver,
    resetFilters,
    selectAll,
    selectDriver,
    selectedDriverIds,
    setProfileDriver,
    updateFilters,
  };
};
