"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import {
  loadFormSchema,
  type LoadFormValues,
} from "@/lib/loads/load-form-schema";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Form } from "@repo/ui/components/form";

import type { Load } from "../types";
import {
  emptyLoadFormValues,
  toLoad,
  toLoadFormValues,
} from "./form-values";
import { LoadDetailsTab } from "./load-details-tab";
import {
  SecondaryTab,
  type LoadFormTab,
} from "./secondary-tabs";

interface LoadFormDialogProps {
  isOpen: boolean;
  load: Load | null;
  onDelete: (loadId: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: (load: Load) => void;
}

export const LoadFormDialog = ({
  isOpen,
  load,
  onDelete,
  onOpenChange,
  onSave,
}: LoadFormDialogProps): React.JSX.Element => {
  const [tab, setTab] = React.useState<LoadFormTab>("overview");
  const form = useForm<LoadFormValues>({
    defaultValues: emptyLoadFormValues,
    resolver: zodResolver(loadFormSchema),
  });

  React.useEffect(() => {
    if (!isOpen) return;
    form.reset(toLoadFormValues(load));
    setTab("overview");
  }, [form, isOpen, load]);

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="flex h-[min(55rem,calc(100svh-2rem))] max-w-[46rem] flex-col">
        <div className="shrink-0 px-7 pt-6 pr-14">
          <DialogTitle>{load ? "Edit load" : "Create load"}</DialogTitle>
          <DialogDescription className="sr-only">
            Create or edit load details and documents.
          </DialogDescription>
          <div className="mt-5 flex gap-5 border-b border-border">
            {[
              ["overview", "Overview"],
              ["timeline", "Timeline"],
              ["route", "Route"],
              ["documents", "Documents"],
              ["activity", "Activity"],
              ["ai-insights", "AI insights"],
            ].map(([id, label]) => (
              <button
                className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${
                  tab === id
                    ? "border-primary-700 text-primary-700"
                    : "border-transparent text-primary-700/70"
                }`}
                key={id}
                onClick={() => setTab(id as LoadFormTab)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              onSave(toLoad(values, load));
              onOpenChange(false);
            })}
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5 [scrollbar-gutter:stable]">
              {tab === "overview" ? (
                <LoadDetailsTab form={form} isEditing={Boolean(load)} />
              ) : (
                <SecondaryTab form={form} tab={tab} />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-7 py-4">
              <div>
                {load ? (
                  <Button
                    className="text-danger hover:bg-danger-background hover:text-danger"
                    onClick={() => {
                      onDelete(load.id);
                      onOpenChange(false);
                    }}
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="size-4" />
                    Delete load
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-3">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  className="bg-primary-700 hover:bg-primary-600"
                  type="submit"
                >
                  {load ? "Save changes" : "Create load"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
