"use client";

import { AlertCircle } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import type { DriverFormValues } from "@/lib/drivers/driver-form-schema";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";

import { DatePickerField } from "./date-picker-field";
import { driverFieldClassName } from "./form-values";
import { ProfilePhoto } from "./profile-photo";

interface ProfileTabProps {
  form: UseFormReturn<DriverFormValues>;
  mutationError: string | null;
}

export const ProfileTab = ({
  form,
  mutationError,
}: ProfileTabProps): React.JSX.Element => (
  <div className="space-y-6">
    <section>
      <h3 className="mb-4 text-base font-bold text-ink-900">
        Personal information
      </h3>
      <div className="grid gap-4 sm:grid-cols-[7rem_1fr_1fr]">
        <ProfilePhoto form={form} />
        {(["firstName", "lastName", "phone", "email"] as const).map((name) => (
          <FormField
            control={form.control}
            key={name}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel color="gray" required>
                  {name === "firstName"
                    ? "First name"
                    : name === "lastName"
                      ? "Last name"
                      : name === "phone"
                        ? "Phone"
                        : "Email"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={driverFieldClassName}
                    type={
                      name === "phone"
                        ? "tel"
                        : name === "email"
                          ? "email"
                          : "text"
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel color="gray">Date of birth</FormLabel>
              <FormControl>
                <DatePickerField
                  onChange={field.onChange}
                  placeholder="Select date of birth"
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel color="gray">Address</FormLabel>
              <FormControl>
                <Input {...field} className={driverFieldClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {(["driverCode", "hireDate"] as const).map((name) => (
          <FormField
            control={form.control}
            key={name}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel color="gray" required={name === "driverCode"}>
                  {name === "driverCode" ? "Driver ID" : "Hire date"}
                </FormLabel>
                <FormControl>
                  {name === "hireDate" ? (
                    <DatePickerField
                      onChange={field.onChange}
                      placeholder="Select hire date"
                      value={field.value}
                    />
                  ) : (
                    <Input {...field} className={driverFieldClassName} />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </section>

    <section className="border-t border-border pt-5">
      <h3 className="mb-4 text-sm font-bold text-ink-900">
        License information
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="licenseType"
          render={({ field }) => (
            <FormItem>
              <FormLabel color="gray" required>
                License type
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={`${driverFieldClassName} w-full`}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {["CDL-A", "CDL-B", "CDL-C"].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="licenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel color="gray" required>
                License number
              </FormLabel>
              <FormControl>
                <Input {...field} className={driverFieldClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="licenseExpirationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel color="gray" required>
                Expiration date
              </FormLabel>
              <FormControl>
                <DatePickerField
                  onChange={field.onChange}
                  placeholder="Select expiration date"
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="licenseState"
          render={({ field }) => (
            <FormItem>
              <FormLabel color="gray" required>
                State
              </FormLabel>
              <FormControl>
                <Input {...field} className={driverFieldClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>

    <section className="border-t border-border pt-5">
      <h3 className="mb-4 text-sm font-bold text-ink-900">Additional info</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["emergencyContact", "emergencyPhone"] as const).map((name) => (
          <FormField
            control={form.control}
            key={name}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel color="gray">
                  {name === "emergencyContact"
                    ? "Emergency contact"
                    : "Emergency phone"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={driverFieldClassName}
                    type={name === "emergencyPhone" ? "tel" : "text"}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
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
                  placeholder="Add any notes about the driver..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>

    {mutationError ? (
      <Alert>
        <AlertCircle />
        <AlertDescription>{mutationError}</AlertDescription>
      </Alert>
    ) : null}
  </div>
);
