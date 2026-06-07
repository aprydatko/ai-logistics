"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

import { toast } from "@repo/ui/components/toaster";

import { ConfirmationAlertDialog } from "@/components/shared";
import { deleteDriver } from "@/lib/drivers/driver-mutations";

import type { DriverRow } from "../types";

interface DeleteDriverDialogProps {
  driver: DriverRow | null;
  onOpenChange: (open: boolean) => void;
}

export const DeleteDriverDialog = ({
  driver,
  onOpenChange,
}: DeleteDriverDialogProps): React.JSX.Element => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ driverId }: { driverId: string; driverName: string }) =>
      deleteDriver(driverId),
    onError: (error, deletedDriver) => {
      onOpenChange(false);
      toast.error("Unable to delete driver", {
        description: `${deletedDriver.driverName}: ${error.message}`,
      });
    },
    onSuccess: async (_, deletedDriver) => {
      onOpenChange(false);
      toast.success("Driver deleted successfully", {
        description: `${deletedDriver.driverName} was removed from the driver list.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });

  const handleConfirmOpenChange = (open: boolean): void => {
    if (mutation.isPending) return;
    if (!open) mutation.reset();
    onOpenChange(open);
  };

  const handleDelete = (): void => {
    if (!driver?.source) return;
    mutation.mutate({
      driverId: driver.source.id,
      driverName: driver.name,
    });
  };

  return (
    <ConfirmationAlertDialog
      confirmIcon={<Trash2 />}
      confirmLabel="Delete driver"
      confirmVariant="destructive"
      description={
        <>
          This will permanently delete {driver?.name ?? "this driver"} and
          remove their driver profile. This action cannot be undone.
        </>
      }
      disabled={!driver?.source}
      onConfirm={handleDelete}
      onOpenChange={handleConfirmOpenChange}
      open={driver !== null}
      pending={mutation.isPending}
      pendingLabel="Deleting..."
      title="Delete driver?"
    />
  );
};
