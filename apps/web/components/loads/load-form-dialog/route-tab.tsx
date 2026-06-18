"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";

import { LazyRouteMap } from "@/components/maps/lazy-route-map";
import type { LoadFormValues } from "@/lib/loads/load-form-schema";
import { Button } from "@repo/ui/components/button";

import { LoadInputField } from "./form-field";

export const RouteTab = ({
  form,
}: {
  form: UseFormReturn<LoadFormValues>;
}): React.JSX.Element => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "routePoints",
  });
  const points = form.watch("routePoints");
  const route = points.map(
    (point) =>
      [Number(point.longitude), Number(point.latitude)] as [number, number],
  );

  return (
    <div className="space-y-5">
      <LazyRouteMap
        center={route[0] ?? [-87.2, 42.3]}
        className="h-56 min-h-56 rounded-lg"
        markers={points.map((point, index) => ({
          coordinates: route[index]!,
          id: fields[index]?.id ?? String(index),
          label: point.label,
        }))}
        route={route}
        zoom={5}
      />
      {fields.map((field, index) => (
        <div
          className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_8rem_8rem_auto]"
          key={field.id}
        >
          <LoadInputField
            form={form}
            label="Point"
            name={`routePoints.${index}.label`}
            required
          />
          <LoadInputField
            form={form}
            label="Latitude"
            name={`routePoints.${index}.latitude`}
            required
            type="number"
          />
          <LoadInputField
            form={form}
            label="Longitude"
            name={`routePoints.${index}.longitude`}
            required
            type="number"
          />
          <Button
            aria-label="Remove route point"
            className="self-end"
            disabled={fields.length <= 2}
            onClick={() => remove(index)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        onClick={() => append({ label: "", latitude: 0, longitude: 0 })}
        type="button"
        variant="outline"
      >
        <Plus className="size-4" /> Add route point
      </Button>
    </div>
  );
};
