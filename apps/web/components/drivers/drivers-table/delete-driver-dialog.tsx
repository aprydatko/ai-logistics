"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { buttonVariants } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toaster";
import { cn } from "@repo/ui/lib/utils";

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
    <AlertDialog
      onOpenChange={handleConfirmOpenChange}
      open={driver !== null}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete driver?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {driver?.name ?? "this driver"} and
            remove their driver profile. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            disabled={mutation.isPending || !driver?.source}
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
          >
            {mutation.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Trash2 />
            )}
            {mutation.isPending ? "Deleting..." : "Delete driver"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
