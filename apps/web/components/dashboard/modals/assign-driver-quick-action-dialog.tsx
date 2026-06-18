"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import * as React from "react";

import { driversQueryOptions } from "@/lib/drivers/drivers-query";
import { assignLoadDriver } from "@/lib/loads/load-mutations";
import {
  loadsQueryOptions,
  syncLoadCache,
  type LoadApiItem,
  type LoadsFilters,
} from "@/lib/loads/loads-query";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";

const loadFilters: LoadsFilters = {
  search: "",
  status: "all",
  pickupFrom: "",
  pickupTo: "",
  page: 1,
  limit: 100,
};

const getAssignableLoads = (loads: LoadApiItem[]): LoadApiItem[] =>
  loads.filter(
    (load) => load.status !== "delivered" && load.status !== "cancelled",
  );

export const AssignDriverQuickActionDialog = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const [loadId, setLoadId] = React.useState("");
  const [driverId, setDriverId] = React.useState("");
  const [averageSpeedMph, setAverageSpeedMph] = React.useState(55);

  const loadsQuery = useQuery(loadsQueryOptions(loadFilters));
  const driversQuery = useQuery(
    driversQueryOptions({
      search: "",
      status: "available",
      isActive: "true",
      page: 1,
      limit: 100,
    }),
  );

  const mutation = useMutation({
    mutationFn: assignLoadDriver,
    onError: (error) =>
      toast.error("Unable to assign driver", { description: error.message }),
    onSuccess: async (updatedLoad) => {
      syncLoadCache(queryClient, updatedLoad);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["drivers"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      onOpenChange(false);
      toast.success("Driver assigned and ETA recalculated");
    },
  });
  const resetMutation = mutation.reset;

  const loads = React.useMemo(
    () => getAssignableLoads(loadsQuery.data?.data ?? []),
    [loadsQuery.data],
  );
  const drivers = React.useMemo(
    () =>
      (driversQuery.data?.data ?? []).filter((driver) => driver.truckNumber),
    [driversQuery.data],
  );
  const selectedLoad = React.useMemo(
    () => loads.find((load) => load.id === loadId) ?? null,
    [loadId, loads],
  );

  React.useEffect(() => {
    if (!isOpen) return;
    setLoadId("");
    setDriverId("");
    setAverageSpeedMph(55);
    resetMutation();
  }, [isOpen, resetMutation]);

  React.useEffect(() => {
    setDriverId(selectedLoad?.driverId ?? "");
  }, [selectedLoad]);

  const isSubmitDisabled =
    !loadId || !driverId || mutation.isPending || loadsQuery.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] max-w-md flex-col">
        <div className="shrink-0 px-7 pt-6 pr-14">
          <DialogTitle>Assign driver</DialogTitle>
          <DialogDescription className="mt-1">
            Choose a load and assign an available driver. ETA will be
            recalculated from distance and average speed.
          </DialogDescription>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({ loadId, driverId, averageSpeedMph });
          }}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-7 py-5">
            <label className="grid gap-2 text-sm font-medium text-primary-700">
              Load
              <Select onValueChange={setLoadId} value={loadId}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select load reference" />
                </SelectTrigger>
                <SelectContent>
                  {loads.map((load) => (
                    <SelectItem key={load.id} value={load.id}>
                      {load.referenceNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            {selectedLoad ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-primary-700">
                <p className="font-medium text-ink-900">
                  {selectedLoad.pickupAddress} {"->"}{" "}
                  {selectedLoad.deliveryAddress}
                </p>
                <p className="mt-1">
                  Current driver:{" "}
                  {selectedLoad.driver
                    ? `${selectedLoad.driver.firstName} ${selectedLoad.driver.lastName}`
                    : "Not assigned"}
                </p>
              </div>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-primary-700">
              Driver
              <Select
                disabled={driversQuery.isPending || drivers.length === 0}
                onValueChange={setDriverId}
                value={driverId}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName} ·{" "}
                      {driver.truckNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-primary-700">
              Average speed (mph)
              <Input
                max={75}
                min={35}
                onChange={(event) =>
                  setAverageSpeedMph(Number(event.target.value))
                }
                type="number"
                value={averageSpeedMph}
              />
            </label>

            {loadsQuery.isError ? (
              <p className="text-sm text-destructive">
                Unable to load loads for assignment.
              </p>
            ) : null}
            {driversQuery.isError ? (
              <p className="text-sm text-destructive">
                Unable to load available drivers.
              </p>
            ) : null}
            {loadsQuery.isSuccess && loads.length === 0 ? (
              <p className="text-sm text-primary-700">
                No active loads available for assignment.
              </p>
            ) : null}
            {driversQuery.isSuccess && drivers.length === 0 ? (
              <p className="text-sm text-primary-700">
                No available drivers with assigned trucks.
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-border  px-7 py-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="bg-primary-700 hover:bg-primary-600"
              disabled={isSubmitDisabled}
              type="submit"
            >
              {mutation.isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : null}
              {mutation.isPending ? "Assigning..." : "Assign driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
