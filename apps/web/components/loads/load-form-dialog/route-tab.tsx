"use client";

import { MapPin, Plus, Trash2 } from "lucide-react";
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
import { RouteMap } from "@repo/ui/components/route-map";

interface RouteTabProps {
  form: UseFormReturn<LoadFormValues>;
}

export const RouteTab = ({ form }: RouteTabProps): React.JSX.Element => {
  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "routePoints",
  });
  const points = form.watch("routePoints");
  const validPoints = points.filter(
    (point) =>
      Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
  );
  const route = validPoints.map(
    (point) => [point.longitude, point.latitude] as [number, number],
  );

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-ink-900">Route points</h3>
          <p className="mt-1 text-xs text-primary-700">
            Add points in travel order. Coordinates update the map immediately.
          </p>
        </div>
        <Button
          onClick={() =>
            append({ label: "", latitude: 0, longitude: 0 })
          }
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
          Add point
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_8rem_8rem_auto]"
            key={field.id}
          >
            <FormField
              control={form.control}
              name={`routePoints.${index}.label`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel color="gray">Point name</FormLabel>
                  <FormControl>
                    <Input {...input} className="h-10 bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(["latitude", "longitude"] as const).map((coordinate) => (
              <FormField
                control={form.control}
                key={coordinate}
                name={`routePoints.${index}.${coordinate}`}
                render={({ field: input }) => (
                  <FormItem>
                    <FormLabel color="gray">
                      {coordinate === "latitude" ? "Latitude" : "Longitude"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 bg-white"
                        name={input.name}
                        onBlur={input.onBlur}
                        onChange={(event) =>
                          input.onChange(event.target.valueAsNumber)
                        }
                        ref={input.ref}
                        step="any"
                        type="number"
                        value={input.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button
              aria-label={`Delete route point ${index + 1}`}
              className="self-end text-danger hover:bg-danger-background hover:text-danger"
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
      </div>

      {route.length >= 2 ? (
        <RouteMap
          center={route[0]!}
          className="h-80 min-h-80"
          markers={validPoints.map((point, index) => ({
            coordinates: [point.longitude, point.latitude],
            id: `route-point-${index}`,
            label: point.label || `Point ${index + 1}`,
            tone:
              index === validPoints.length - 1
                ? "danger"
                : index === 0
                  ? "success"
                  : "warning",
          }))}
          route={route}
          zoom={6}
        />
      ) : (
        <div className="grid h-64 place-items-center rounded-lg border border-dashed border-border text-center text-xs text-primary-700">
          <div>
            <MapPin className="mx-auto mb-2 size-5" />
            Enter at least two valid coordinate pairs to preview the route.
          </div>
        </div>
      )}
    </section>
  );
};
