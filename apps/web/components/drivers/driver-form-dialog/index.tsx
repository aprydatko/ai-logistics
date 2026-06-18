"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useForm } from "react-hook-form";

import {
  driverFormSchema,
  type DriverFormValues,
} from "@/lib/drivers/driver-form-schema";
import {
  addDriverDocument,
  saveDriver,
  type DriverDocumentInput,
} from "@/lib/drivers/driver-mutations";
import {
  driverDetailsQueryOptions,
  syncDriverListCache,
  type DriversApiItem,
} from "@/lib/drivers/drivers-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Form } from "@repo/ui/components/form";
import { toast } from "@repo/ui/components/toaster";

import { DialogFooter } from "./dialog-footer";
import { DocumentsTab } from "./documents-tab";
import { emptyDriverFormValues, toDriverFormValues } from "./form-values";
import { ProfileTab } from "./profile-tab";
import { TruckTab } from "./truck-tab";

interface DriverFormDialogProps {
  driver: DriversApiItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type DriverTab = "info" | "truck" | "documents";

const tabs: Array<{ id: DriverTab; label: string }> = [
  { id: "info", label: "Info" },
  { id: "truck", label: "Truck" },
  { id: "documents", label: "Docs" },
];

export const DriverFormDialog = ({
  driver,
  isOpen,
  onOpenChange,
}: DriverFormDialogProps): React.JSX.Element => {
  const [tab, setTab] = React.useState<DriverTab>("info");
  const [pendingDocument, setPendingDocument] =
    React.useState<DriverDocumentInput | null>(null);
  const queryClient = useQueryClient();
  const detailsQuery = useQuery(driverDetailsQueryOptions(driver?.id ?? ""));
  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: emptyDriverFormValues,
  });
  const mutation = useMutation({
    mutationFn: saveDriver,
    onError: (error) => {
      toast.error(
        driver ? "Unable to update driver" : "Unable to create driver",
        {
          description: error.message,
        },
      );
    },
    onSuccess: async (savedDriver) => {
      let documentUploaded = true;
      if (!driver && pendingDocument) {
        try {
          await addDriverDocument({
            driverId: savedDriver.id,
            document: pendingDocument,
          });
        } catch (error: unknown) {
          documentUploaded = false;
          toast.error("Driver created, but document upload failed", {
            description:
              error instanceof Error ? error.message : "Please try again.",
          });
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["drivers", savedDriver.id],
        }),
      ]);
      syncDriverListCache(queryClient, savedDriver);
      onOpenChange(false);
      if (documentUploaded) {
        toast.success(
          driver
            ? "Driver updated successfully"
            : "Driver created successfully",
          {
            description: driver
              ? `${driver.firstName} ${driver.lastName} was updated.`
              : pendingDocument
                ? "The driver and document were added."
                : "The new driver was added to the driver list.",
          },
        );
      }
    },
  });
  const resetMutation = mutation.reset;

  React.useEffect(() => {
    if (!isOpen) return;

    form.reset(toDriverFormValues(driver));
    setPendingDocument(null);
    resetMutation();
    setTab("info");
  }, [driver, form, isOpen, resetMutation]);

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="flex h-[min(52rem,calc(100svh-2rem))] max-w-[36rem] flex-col">
        <div className="shrink-0 px-7 pt-6 pr-14">
          <DialogTitle>{driver ? "Edit driver" : "Add new driver"}</DialogTitle>
          <DialogDescription className="sr-only">
            Driver profile and document information.
          </DialogDescription>
          <div className="mt-5 flex gap-5 overflow-x-auto border-b border-border">
            {tabs.map((item) => (
              <button
                className={`border-b-2 px-1 pb-3 text-sm font-semibold capitalize transition ${
                  tab === item.id
                    ? "border-primary-700 text-primary-700"
                    : "border-transparent text-primary-700/70 hover:text-primary-700"
                }`}
                key={item.id}
                onClick={() => setTab(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            noValidate
            onSubmit={form.handleSubmit((values) =>
              mutation.mutate({ driverId: driver?.id, values }),
            )}
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5 pr-5 [scrollbar-color:var(--primary-700)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:my-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-primary-700/35 [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-primary-700/60">
              {tab === "info" ? (
                <ProfileTab
                  form={form}
                  mutationError={
                    mutation.isError ? mutation.error.message : null
                  }
                />
              ) : null}
              {tab === "truck" ? (
                <TruckTab details={detailsQuery.data} driverId={driver?.id} />
              ) : null}
              {tab === "documents" ? (
                <DocumentsTab
                  details={detailsQuery.data}
                  driverId={driver?.id}
                  onPendingDocumentChange={setPendingDocument}
                  pendingDocument={pendingDocument}
                />
              ) : null}
            </div>
            <DialogFooter
              form={form}
              isEditing={Boolean(driver)}
              isPending={mutation.isPending}
              isSubmitDisabled={Boolean(driver) && tab !== "info"}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
