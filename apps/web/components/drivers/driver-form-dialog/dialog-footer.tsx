"use client";

import { LoaderCircle } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { DialogClose } from "@repo/ui/components/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@repo/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import type { DriverFormValues } from "@/lib/drivers/driver-form-schema";

interface DialogFooterProps {
  form: UseFormReturn<DriverFormValues>;
  isEditing: boolean;
  isPending: boolean;
  isSubmitDisabled: boolean;
}

export const DialogFooter = ({
  form,
  isEditing,
  isPending,
  isSubmitDisabled,
}: DialogFooterProps): React.JSX.Element => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-7 py-4">
    <div className="flex items-center gap-3">
      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            </FormControl>
            <FormLabel className="cursor-pointer" color="gray">
              Set driver status
            </FormLabel>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className="h-9 w-36 border-0 bg-emerald-50 text-emerald-700 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_trip">On trip</SelectItem>
              <SelectItem value="off_duty">Off duty</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </div>
    <div className="flex gap-3">
      <DialogClose asChild>
        <Button type="button" variant="outline">
          Cancel
        </Button>
      </DialogClose>
      <Button
        className="bg-primary-700 hover:bg-primary-600"
        disabled={isPending || isSubmitDisabled}
        type="submit"
      >
        {isPending ? <LoaderCircle className="animate-spin" /> : null}
        {isPending ? "Saving..." : isEditing ? "Save changes" : "Save driver"}
      </Button>
    </div>
  </div>
);
