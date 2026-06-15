import type { ChangeEvent } from "react";
import { AlertTriangle, Circle } from "lucide-react";

import type { LoadApiItem } from "@/lib/loads/loads-query";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";

import type { IncidentPriority, IncidentStatus } from "../types";
import { incidentTypeLabels } from "../types";
import { DateTimePickerField } from "./date-time-picker-field";
import type { IncidentFormValues } from "./form-values";

type OverviewTabProps = {
  values: IncidentFormValues;
  onChange: <Key extends keyof IncidentFormValues>(
    key: Key,
    value: IncidentFormValues[Key],
  ) => void;
  loads: LoadApiItem[];
};

const fieldClassName = "h-12 w-full bg-white shadow-none";

const Field = ({
  children,
  label,
  required = false,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}): React.JSX.Element => (
  <label className="grid gap-2 text-sm font-medium text-primary-700">
    <span>
      {label} {required ? <span className="text-destructive">*</span> : null}
    </span>
    {children}
  </label>
);

export const OverviewTab = ({
  loads,
  values,
  onChange,
}: OverviewTabProps): React.JSX.Element => (
  <div className="space-y-7">
    <section>
      <h3 className="mb-5 text-base font-bold text-ink-900">
        Incident information
      </h3>
      <div className="grid gap-x-7 gap-y-5 sm:grid-cols-2">
        <Field label="Title" required>
          <Input
            className={fieldClassName}
            onChange={(event) => onChange("title", event.target.value)}
            placeholder="Accident detected"
            required
            value={values.title}
          />
        </Field>
        <Field label="Incident type" required>
          <Select
            value={values.type}
            onValueChange={(value) =>
              onChange("type", value as IncidentFormValues["type"])
            }
          >
            <SelectTrigger className={fieldClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(incidentTypeLabels) as Array<
                  [IncidentFormValues["type"], string]
                >
              ).map(([type, label]) => (
                <SelectItem key={type} value={type}>
                  <AlertTriangle className="text-destructive" />
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Severity" required>
          <Select
            value={values.priority}
            onValueChange={(value) =>
              onChange("priority", value as IncidentPriority)
            }
          >
            <SelectTrigger className={fieldClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["critical", "high", "medium", "low"] as const).map(
                (priority) => (
                  <SelectItem key={priority} value={priority}>
                    <Circle
                      className={
                        priority === "critical" || priority === "high"
                          ? "fill-red-500 text-red-500"
                          : priority === "medium"
                            ? "fill-amber-500 text-amber-500"
                            : "fill-blue-500 text-blue-500"
                      }
                    />
                    {priority[0]?.toUpperCase()}
                    {priority.slice(1)}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Location" required>
          <Input
            className={fieldClassName}
            onChange={(event) => onChange("location", event.target.value)}
            placeholder="I-94, Michigan"
            required
            value={values.location}
          />
        </Field>
        <Field label="Incident time" required>
          <DateTimePickerField
            onChange={(value) => onChange("occurredAt", value)}
            value={values.occurredAt}
          />
        </Field>
        <Field label="Status" required>
          <Select
            value={values.status}
            onValueChange={(value) =>
              onChange("status", value as IncidentStatus)
            }
          >
            <SelectTrigger className={fieldClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                [
                  "open",
                  "investigating",
                  "monitoring",
                  "resolved",
                  "closed",
                ] as const
              ).map((status) => (
                <SelectItem key={status} value={status}>
                  {status[0]?.toUpperCase()}
                  {status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Reported by">
          <Input
            className={fieldClassName}
            onChange={(event) => onChange("reportedBy", event.target.value)}
            value={values.reportedBy}
          />
        </Field>
        <label className="grid gap-2 text-sm font-medium text-primary-700 sm:col-span-2">
          <span>
            Description <span className="text-destructive">*</span>
          </span>
          <div className="relative">
            <Textarea
              className="min-h-36 resize-none bg-white pb-8 shadow-none"
              maxLength={1000}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                onChange("description", event.target.value)
              }
              placeholder="Describe what happened..."
              required
              value={values.description}
            />
            <span className="absolute right-3 bottom-3 text-xs text-primary-700">
              {values.description.length}/1000
            </span>
          </div>
        </label>
      </div>
    </section>

    <section className="border-t border-border pt-6">
      <h3 className="mb-5 text-sm font-bold text-ink-900">
        Related load{" "}
        <span className="font-normal text-primary-700">(optional)</span>
      </h3>
      <div className="grid gap-x-7 gap-y-5 sm:grid-cols-2">
        <Field label="Load reference" required>
          <Select
            value={values.loadId}
            onValueChange={(value) => onChange("loadId", value)}
          >
            <SelectTrigger className={fieldClassName}>
              <SelectValue placeholder="Select load reference" />
            </SelectTrigger>
            <SelectContent>
              {loads.map((load) => (
                <SelectItem key={load.id} value={load.id}>
                  {load.referenceNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Driver">
          <Input
            className={fieldClassName}
            disabled
            value={(() => {
              const driver = loads.find(
                ({ id }) => id === values.loadId,
              )?.driver;
              return driver
                ? `${driver.firstName} ${driver.lastName}`
                : "No driver assigned to selected load";
            })()}
          />
        </Field>
      </div>
    </section>
  </div>
);
