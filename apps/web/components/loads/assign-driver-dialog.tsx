"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { driversQueryOptions } from "@/lib/drivers/drivers-query";
import { assignLoadDriver } from "@/lib/loads/load-mutations";
import type { LoadApiItem } from "@/lib/loads/loads-query";
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

export const AssignDriverDialog = ({
  load,
  onOpenChange,
}: {
  load: LoadApiItem | null;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const [driverId, setDriverId] = useState("");
  const [averageSpeedMph, setAverageSpeedMph] = useState(55);
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loads"] }),
        queryClient.invalidateQueries({ queryKey: ["drivers"] }),
      ]);
      onOpenChange(false);
      toast.success("Driver assigned and ETA recalculated");
    },
  });

  useEffect(() => {
    if (!load) return;
    setDriverId(load.driverId ?? "");
    setAverageSpeedMph(55);
  }, [load]);

  const drivers = (driversQuery.data?.data ?? []).filter(
    (driver) => driver.truckNumber,
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(load)}>
      <DialogContent className="max-w-md">
        <DialogTitle>Assign driver</DialogTitle>
        <DialogDescription>
          Select an available driver. ETA is recalculated from distance and
          average speed.
        </DialogDescription>
        <div className="space-y-4 py-4">
          <Select onValueChange={setDriverId} value={driverId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select driver" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.firstName} {driver.lastName} · {driver.truckNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {driversQuery.isSuccess && drivers.length === 0 ? (
            <p className="text-sm text-primary-700">
              No available drivers with assigned trucks.
            </p>
          ) : null}
          <label className="grid gap-2 text-sm font-medium">
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
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={!driverId || mutation.isPending || !load}
            onClick={() => {
              if (load)
                mutation.mutate({ loadId: load.id, driverId, averageSpeedMph });
            }}
            type="button"
          >
            {mutation.isPending ? "Assigning..." : "Assign driver"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
