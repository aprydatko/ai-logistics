"use client";

import { Camera, UserRound } from "lucide-react";
import * as React from "react";
import type { UseFormReturn } from "react-hook-form";

import type { DriverFormValues } from "@/lib/drivers/driver-form-schema";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";

export const ProfilePhoto = ({
  form,
}: {
  form: UseFormReturn<DriverFormValues>;
}): React.JSX.Element => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const avatarUrl = form.watch("avatarUrl");
  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 1_500_000) {
      form.setError("avatarUrl", {
        message: "Choose an image smaller than 1.5 MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      form.setValue("avatarUrl", String(reader.result), {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.clearErrors("avatarUrl");
    };
    reader.readAsDataURL(file);
  };

  return (
    <FormField
      control={form.control}
      name="avatarUrl"
      render={() => (
        <FormItem className="content-start self-start sm:row-span-2">
          <FormLabel
            className="h-auto min-h-4 self-start items-start"
            color="gray"
          >
            Profile photo
          </FormLabel>
          <div className="flex items-center gap-3 sm:flex-col sm:items-start">
            <div className="relative">
              <Avatar className="size-20 border border-border bg-surface-100">
                <AvatarImage alt="Driver profile" src={avatarUrl} />
                <AvatarFallback className="text-lg font-semibold">
                  {initials || <UserRound className="size-7" />}
                </AvatarFallback>
              </Avatar>
              <button
                aria-label="Upload profile photo"
                className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border border-border bg-white text-primary-700 shadow-sm hover:bg-surface-100"
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                <Camera className="size-4" />
              </button>
            </div>
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handlePhoto}
              ref={inputRef}
              type="file"
            />
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
