import { Search } from "lucide-react";
import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";

type SearchFieldProps = Omit<React.ComponentProps<"input">, "type"> & {
  label: string;
};

export function SearchField({
  className,
  label,
  ...props
}: SearchFieldProps): React.JSX.Element {
  return (
    <label className={cn("block w-full", className)}>
      <span className="sr-only">{label}</span>
      <InputGroup className="h-9 rounded-lg border-border bg-card shadow-none">
        <InputGroupInput
          className="text-sm font-normal text-primary-700 placeholder:text-primary-700/70"
          type="search"
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <Search className="size-3.5 text-primary-700" />
        </InputGroupAddon>
      </InputGroup>
    </label>
  );
}
