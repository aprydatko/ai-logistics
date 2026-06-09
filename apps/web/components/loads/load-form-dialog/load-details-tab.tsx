"use client";

import { ArrowRight, MapPin } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import type { LoadFormValues } from "@/lib/loads/load-form-schema";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { RouteMap } from "@repo/ui/components/route-map";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";

import { LoadInputField } from "./form-field";

interface LoadDetailsTabProps {
  form: UseFormReturn<LoadFormValues>;
  isEditing: boolean;
}

const selectOptions = {
  priority: ["High", "Medium", "Low"],
  status: [
    "In Transit",
    "Delayed",
    "Delivered",
    "Pending",
    "Assigned",
    "Cancelled",
  ],
} as const;

export const LoadDetailsTab = ({
  form,
  isEditing,
}: LoadDetailsTabProps): React.JSX.Element => {
  const origin = form.watch("origin");
  const destination = form.watch("destination");
  const route = [
    [-87.6298, 41.8781],
    [-86.7, 42.05],
    [-85.8, 42.1],
    [-84.9, 42.25],
    [-83.0458, 42.3314],
  ] as Array<[number, number]>;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-4 text-sm font-bold text-ink-900">
          General information
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <LoadInputField
            disabled={isEditing}
            form={form}
            label="Load ID"
            name="id"
            placeholder="LD-00001"
            required
          />
          {(["status", "priority"] as const).map((name) => (
            <FormField
              control={form.control}
              key={name}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel color="gray" required>
                    {name === "status" ? "Status" : "Priority"}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 w-full bg-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectOptions[name].map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <div className="sm:col-span-3">
            <LoadInputField
              form={form}
              label="Cargo"
              name="cargo"
              placeholder="Equipment parts"
              required
            />
          </div>
          <LoadInputField
            form={form}
            label="Origin"
            name="origin"
            placeholder="Chicago, IL"
            required
          />
          <div className="hidden items-end justify-center pb-3 sm:flex">
            <ArrowRight className="size-4 text-primary-700" />
          </div>
          <LoadInputField
            form={form}
            label="Destination"
            name="destination"
            placeholder="Detroit, MI"
            required
          />
          <LoadInputField
            form={form}
            label="ETA"
            name="eta"
            required
            type="datetime-local"
          />
          <LoadInputField
            form={form}
            label="Distance"
            name="distance"
            placeholder="283 mi"
            required
          />
          <LoadInputField
            form={form}
            label="Weight"
            name="weight"
            placeholder="24,000 lbs"
            required
          />
        </div>
      </section>

      <section className="border-t border-border pt-5">
        <h3 className="mb-4 text-sm font-bold text-ink-900">Assignment</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <LoadInputField form={form} label="Driver" name="driverName" />
          <LoadInputField form={form} label="Truck ID" name="truckId" />
          <LoadInputField form={form} label="Truck model" name="truckModel" />
        </div>
      </section>

      <section className="border-t border-border pt-5">
        <h3 className="mb-4 text-sm font-bold text-ink-900">Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <LoadInputField
            form={form}
            label="Customer"
            name="customer"
            required
          />
          <LoadInputField
            form={form}
            label="Contact"
            name="contact"
            type="tel"
          />
          <LoadInputField form={form} label="Reference" name="reference" />
          <LoadInputField form={form} label="Temperature" name="temperature" />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel color="gray">Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-20 bg-white"
                    placeholder="Add any notes about this load..."
                  />
                </FormControl>
                <div className="flex justify-between">
                  <FormMessage />
                  <span className="ml-auto text-[0.7rem] text-primary-700">
                    {field.value.length}/250
                  </span>
                </div>
              </FormItem>
            )}
          />
        </div>
      </section>

      <section className="border-t border-border pt-5">
        <h3 className="mb-4 text-sm font-bold text-ink-900">Route preview</h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <RouteMap
            center={[-87.2, 42.3]}
            className="h-52 min-h-52"
            markers={[
              { coordinates: route[0]!, id: "origin", label: origin || "Origin" },
              {
                coordinates: route.at(-1)!,
                id: "destination",
                label: destination || "Destination",
              },
            ]}
            route={route}
            zoom={6}
          />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-white p-4 text-xs">
            <div>
              <MapPin className="mb-2 size-4 text-primary-700" />
              <p className="font-semibold text-ink-900">{origin || "Origin"}</p>
            </div>
            <ArrowRight className="size-4 text-primary-700" />
            <div className="text-right">
              <MapPin className="mb-2 ml-auto size-4 text-primary-700" />
              <p className="font-semibold text-ink-900">
                {destination || "Destination"}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-primary-700">
          Route geometry is a preview. Geocoding and automatic distance
          calculation require a routing provider.
        </p>
      </section>
    </div>
  );
};
