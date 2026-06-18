"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, LoaderCircle, Truck } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import {
  saveDriverVehicle,
  type DriverVehicleInput,
} from "@/lib/drivers/driver-mutations";
import {
  syncDriverTruckNumberInLists,
  type DriverDetails,
} from "@/lib/drivers/drivers-query";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";

import { DatePickerField } from "./date-picker-field";
import { driverFieldClassName } from "./form-values";

const emptyVehicle: DriverVehicleInput = {
  unitNumber: "",
  type: "truck",
  make: "",
  model: "",
  licensePlate: "",
  status: "active",
  lastServiceAt: "",
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read truck image"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read truck image"));
        return;
      }
      resolve(result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(file);
  });

export const TruckTab = ({
  details,
  driverId,
}: {
  details?: DriverDetails;
  driverId?: string;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const [image, setImage] = React.useState<File | null>(null);
  const [values, setValues] = React.useState<DriverVehicleInput>(emptyVehicle);
  const vehicle = details?.currentVehicle;

  React.useEffect(() => {
    setValues(
      vehicle
        ? {
            unitNumber: vehicle.unitNumber,
            type: vehicle.type,
            make: vehicle.make ?? "",
            model: vehicle.model ?? "",
            year: vehicle.year ?? undefined,
            licensePlate: vehicle.licensePlate ?? "",
            odometerMiles: vehicle.odometerMiles ?? undefined,
            status: vehicle.status,
            lastServiceAt: vehicle.lastServiceAt ?? "",
          }
        : { ...emptyVehicle, unitNumber: details?.truckNumber ?? "" },
    );
    setImage(null);
  }, [details?.truckNumber, vehicle]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!driverId) throw new Error("Save the driver before adding a truck");
      if (!values.unitNumber.trim()) {
        throw new Error("Truck number is required");
      }
      if (image && image.size > 2 * 1024 * 1024) {
        throw new Error("Truck image must be 2 MB or smaller");
      }
      if (
        image &&
        !["image/jpeg", "image/png", "image/webp"].includes(image.type)
      ) {
        throw new Error("Upload a JPEG, PNG, or WebP image");
      }

      await saveDriverVehicle({
        driverId,
        vehicle: {
          ...values,
          imageMimeType: image?.type as DriverVehicleInput["imageMimeType"],
          imageContent: image ? await fileToBase64(image) : undefined,
        },
      });
    },
    onError: (error) =>
      toast.error("Unable to save truck", { description: error.message }),
    onSuccess: async () => {
      if (driverId) {
        queryClient.setQueryData(
          ["drivers", driverId],
          (current: DriverDetails | undefined) =>
            current
              ? {
                  ...current,
                  truckNumber: values.unitNumber || null,
                }
              : current,
        );
        syncDriverTruckNumberInLists(
          queryClient,
          driverId,
          values.unitNumber || null,
        );
      }

      await queryClient.invalidateQueries({
        queryKey: ["drivers", driverId],
      });
      toast.success("Truck information saved");
    },
  });
  const setField = <Key extends keyof DriverVehicleInput>(
    key: Key,
    value: DriverVehicleInput[Key],
  ): void => setValues((current) => ({ ...current, [key]: value }));
  const previewUrl = React.useMemo(
    () => (image ? URL.createObjectURL(image) : vehicle?.imageUrl),
    [image, vehicle?.imageUrl],
  );

  React.useEffect(
    () => () => {
      if (image && previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [image, previewUrl],
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="relative flex h-36 items-center justify-center bg-surface-100">
          {previewUrl ? (
            <Image
              alt="Truck"
              className="object-cover"
              fill
              src={previewUrl}
              unoptimized
            />
          ) : (
            <Truck className="size-14 text-primary-700/35" />
          )}
          <Button
            className="absolute right-3 bottom-3 bg-white"
            onClick={() => imageInputRef.current?.click()}
            size="sm"
            type="button"
            variant="outline"
          >
            <Camera />
            {image ? image.name : "Truck photo"}
          </Button>
          <Input
            accept=".jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            ref={imageInputRef}
            type="file"
          />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-ink-900">
                Truck {values.unitNumber || "unit"}
              </h3>
              <p className="text-primary-700">
                {[values.year, values.make, values.model]
                  .filter(Boolean)
                  .join(" ") || "Model not specified"}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                values.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              ● {values.status}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Truck number">
          <Input
            className={driverFieldClassName}
            onChange={(event) => setField("unitNumber", event.target.value)}
            value={values.unitNumber}
          />
        </Field>
        <Field label="Type">
          <Input
            className={driverFieldClassName}
            onChange={(event) => setField("type", event.target.value)}
            value={values.type}
          />
        </Field>
        <Field label="Make">
          <Input
            className={driverFieldClassName}
            onChange={(event) => setField("make", event.target.value)}
            value={values.make}
          />
        </Field>
        <Field label="Model">
          <Input
            className={driverFieldClassName}
            onChange={(event) => setField("model", event.target.value)}
            value={values.model}
          />
        </Field>
        <Field label="Year">
          <Input
            className={driverFieldClassName}
            min={1900}
            onChange={(event) =>
              setField("year", event.target.valueAsNumber || undefined)
            }
            type="number"
            value={values.year ?? ""}
          />
        </Field>
        <Field label="Plate">
          <Input
            className={driverFieldClassName}
            onChange={(event) => setField("licensePlate", event.target.value)}
            value={values.licensePlate}
          />
        </Field>
        <Field label="Odometer (mi)">
          <Input
            className={driverFieldClassName}
            min={0}
            onChange={(event) =>
              setField("odometerMiles", event.target.valueAsNumber || undefined)
            }
            type="number"
            value={values.odometerMiles ?? ""}
          />
        </Field>
        <Field label="Last service">
          <DatePickerField
            onChange={(value) => setField("lastServiceAt", value)}
            placeholder="Select last service date"
            value={values.lastServiceAt}
          />
        </Field>
        <Field label="Status">
          <Select
            onValueChange={(value) =>
              setField("status", value as DriverVehicleInput["status"])
            }
            value={values.status}
          >
            <SelectTrigger className="h-10 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Button
        disabled={mutation.isPending || !driverId}
        onClick={() => mutation.mutate()}
        type="button"
      >
        {mutation.isPending ? <LoaderCircle className="animate-spin" /> : null}
        Save truck
      </Button>
    </div>
  );
};

const Field = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}): React.JSX.Element => (
  <div>
    <Label className="mb-2 block">{label}</Label>
    {children}
  </div>
);
