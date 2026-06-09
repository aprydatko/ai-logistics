"use client";

import type { UseFormReturn } from "react-hook-form";

import type { LoadFormValues } from "@/lib/loads/load-form-schema";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";

import { LoadInputField } from "./form-field";
import { DateTimePickerField } from "./date-time-picker-field";

export const LoadDetailsTab = ({
  form,
}: {
  form: UseFormReturn<LoadFormValues>;
}): React.JSX.Element => (
  <div className="space-y-6">
    <section>
      <h3 className="mb-4 text-sm font-bold text-ink-900">Load information</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <LoadInputField
          form={form}
          label="Reference number"
          name="referenceNumber"
          placeholder="LD-00001"
          required
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel color="gray" required>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10 w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {["pending", "assigned", "in_transit", "delivered", "cancelled"].map(
                    (status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace("_", " ")}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadInputField form={form} label="Pickup address" name="pickupAddress" required />
        <LoadInputField form={form} label="Delivery address" name="deliveryAddress" required />
        {(["pickupDate", "deliveryDate"] as const).map((name) => (
          <FormField
            control={form.control}
            key={name}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel color="gray" required>
                  {name === "pickupDate" ? "Pickup date" : "Delivery / ETA"}
                </FormLabel>
                <FormControl>
                  <DateTimePickerField
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <LoadInputField form={form} label="Weight (lb)" name="weight" required type="number" />
        <LoadInputField form={form} label="Distance (mi)" name="miles" required type="number" />
        <LoadInputField form={form} label="Price (USD)" name="price" required step="0.01" type="number" />
      </div>
    </section>

    <section className="border-t border-border pt-5">
      <h3 className="mb-4 text-sm font-bold text-ink-900">Broker</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <LoadInputField form={form} label="Broker ID" name="brokerId" required />
        <LoadInputField form={form} label="Company" name="brokerCompanyName" required />
        <LoadInputField form={form} label="Phone" name="brokerPhone" required type="tel" />
      </div>
    </section>

    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel color="gray">Notes</FormLabel>
          <FormControl>
            <Textarea {...field} className="min-h-24 bg-white" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);
