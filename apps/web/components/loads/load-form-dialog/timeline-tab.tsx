"use client";

import { Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@repo/ui/components/textarea";

import { LoadInputField } from "./form-field";
import { DateTimePickerField } from "./date-time-picker-field";

export const TimelineTab = ({
  form,
}: {
  form: UseFormReturn<LoadFormValues>;
}): React.JSX.Element => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "timeline",
  });

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-primary-700">
          No timeline events yet.
        </p>
      ) : null}
      {fields.map((field, index) => (
        <div
          className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
          key={field.id}
        >
          <LoadInputField
            form={form}
            label="Event"
            name={`timeline.${index}.title`}
            required
          />
          <FormField
            control={form.control}
            name={`timeline.${index}.dateTime`}
            render={({ field: dateField }) => (
              <FormItem>
                <FormLabel color="gray" required>
                  Date and time
                </FormLabel>
                <FormControl>
                  <DateTimePickerField
                    onChange={dateField.onChange}
                    value={dateField.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`timeline.${index}.description`}
            render={({ field: descriptionField }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel color="gray">Description</FormLabel>
                <FormControl>
                  <Textarea {...descriptionField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button onClick={() => remove(index)} type="button" variant="ghost">
            <Trash2 className="size-4" /> Remove event
          </Button>
        </div>
      ))}
      <Button
        onClick={() =>
          append({
            title: "",
            description: "",
            dateTime: new Date().toISOString().slice(0, 16),
          })
        }
        type="button"
        variant="outline"
      >
        <Plus className="size-4" /> Add event
      </Button>
    </div>
  );
};
