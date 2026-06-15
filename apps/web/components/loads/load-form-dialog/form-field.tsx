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

type LoadInputFieldProps = {
  form: UseFormReturn<LoadFormValues>;
  label: string;
  name: import("react-hook-form").FieldPath<LoadFormValues>;
  placeholder?: string;
  required?: boolean;
  step?: string;
  type?: React.HTMLInputTypeAttribute;
};

export const LoadInputField = ({
  form,
  label,
  name,
  placeholder,
  required,
  step,
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
            className="h-10 bg-white"
            name={field.name}
            onBlur={field.onBlur}
            onChange={field.onChange}
            placeholder={placeholder}
            ref={field.ref}
            step={step}
            type={type}
            value={
              typeof field.value === "string" || typeof field.value === "number"
                ? field.value
                : ""
            }
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
