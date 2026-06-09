"use client";

import { Clock3, Plus, Trash2 } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";

import type { LoadFormValues } from "@/lib/loads/load-form-schema";
import { Button } from "@repo/ui/components/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";

interface TimelineTabProps {
  form: UseFormReturn<LoadFormValues>;
}

export const TimelineTab = ({
  form,
}: TimelineTabProps): React.JSX.Element => {
  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "timeline",
  });

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-ink-900">Timeline events</h3>
          <p className="mt-1 text-xs text-primary-700">
            Add planned milestones or update completed load events.
          </p>
        </div>
        <Button
          onClick={() =>
            append({ dateTime: "", description: "", title: "" })
          }
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
          Add event
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-xs text-primary-700">
            <Clock3 className="mx-auto mb-3 size-5" />
            No timeline events. Add the first milestone.
          </div>
        ) : null}
        {fields.map((field, index) => (
          <div
            className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2"
            key={field.id}
          >
            <FormField
              control={form.control}
              name={`timeline.${index}.title`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel color="gray">Event title</FormLabel>
                  <FormControl>
                    <Input {...input} className="h-10 bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`timeline.${index}.dateTime`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel color="gray">Date and time</FormLabel>
                  <FormControl>
                    <Input
                      {...input}
                      className="h-10 bg-white"
                      type="datetime-local"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`timeline.${index}.description`}
              render={({ field: input }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel color="gray">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...input}
                      className="min-h-20 bg-white"
                      placeholder="Event details..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2 sm:text-right">
              <Button
                className="text-danger hover:bg-danger-background hover:text-danger"
                onClick={() => remove(index)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Trash2 className="size-4" />
                Delete event
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
