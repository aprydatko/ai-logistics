"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  loadFormSchema,
  type LoadFormValues,
} from "@/lib/loads/load-form-schema";
import { invalidateDashboardQueries } from "@/lib/dashboard/dashboard-query";
import { saveLoad } from "@/lib/loads/load-mutations";
import { syncLoadCache, type LoadApiItem } from "@/lib/loads/loads-query";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Form } from "@repo/ui/components/form";
import { toast } from "@repo/ui/components/toaster";

import { emptyLoadFormValues, toLoadFormValues } from "./form-values";
import { LoadDetailsTab } from "./load-details-tab";
import { RouteTab } from "./route-tab";
import { TimelineTab } from "./timeline-tab";

export const LoadFormDialog = ({
  isOpen,
  load,
  onOpenChange,
}: {
  isOpen: boolean;
  load: LoadApiItem | null;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"overview" | "route" | "timeline">("overview");
  const form = useForm<LoadFormValues>({
    defaultValues: emptyLoadFormValues,
    resolver: zodResolver(loadFormSchema),
  });
  const mutation = useMutation({
    mutationFn: saveLoad,
    onError: (error) =>
      toast.error("Unable to save load", { description: error.message }),
    onSuccess: async (savedLoad) => {
      syncLoadCache(queryClient, savedLoad);
      await invalidateDashboardQueries(queryClient, "loads");
      onOpenChange(false);
      toast.success(load ? "Load updated" : "Load created");
    },
  });
  const resetMutation = mutation.reset;

  useEffect(() => {
    if (!isOpen) return;
    form.reset(toLoadFormValues(load));
    resetMutation();
    setTab("overview");
  }, [form, isOpen, load, resetMutation]);

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="flex h-[min(50rem,calc(100svh-2rem))] max-w-[42rem] flex-col">
        <div className="px-7 pt-6 pr-14">
          <DialogTitle>{load ? "Edit load" : "Create load"}</DialogTitle>
          <DialogDescription>
            Save route, schedule, commercial, and broker information.
          </DialogDescription>
          <div className="mt-5 flex gap-5 border-b border-border">
            {(["overview", "route", "timeline"] as const).map((item) => (
              <button
                className={`border-b-2 px-1 pb-3 text-sm font-semibold capitalize ${
                  tab === item
                    ? "border-primary-700 text-primary-700"
                    : "border-transparent text-primary-700/70"
                }`}
                key={item}
                onClick={() => setTab(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutate({ loadId: load?.id, values }),
            )}
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">
              {tab === "overview" ? <LoadDetailsTab form={form} /> : null}
              {tab === "route" ? <RouteTab form={form} /> : null}
              {tab === "timeline" ? <TimelineTab form={form} /> : null}
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-7 py-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={mutation.isPending} type="submit">
                {mutation.isPending
                  ? "Saving..."
                  : load
                    ? "Save changes"
                    : "Create load"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
