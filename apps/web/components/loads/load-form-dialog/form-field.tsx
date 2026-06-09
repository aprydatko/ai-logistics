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
import { Input } from "@repo/ui/components/input";

interface LoadInputFieldProps {
  disabled?: boolean;
  form: UseFormReturn<LoadFormValues>;
  label: string;
  name: Exclude<keyof LoadFormValues, "routePoints" | "timeline">;
  placeholder?: string;
  required?: boolean;
  type?: React.HTMLInputTypeAttribute;
}

export const LoadInputField = ({
  disabled,
  form,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: LoadInputFieldProps): React.JSX.Element => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel color="gray" required={required}>
          {label}
        </FormLabel>
        <FormControl>
          <Input
            {...field}
            className="h-10 bg-white"
            disabled={disabled}
            placeholder={placeholder}
            type={type}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
