"use client";

import * as React from "react";

import { Button } from "@repo/ui/components/button";

import {
  AlertTriangle,
  FileUp,
  PackagePlus,
  UserRoundCheck,
} from "lucide-react";

import { AssignDriverQuickActionDialog } from "./modals/assign-driver-quick-action-dialog";

const quickActions = [
  { icon: UserRoundCheck, label: "Assign driver" },
  { icon: PackagePlus, label: "Create load" },
  { icon: AlertTriangle, label: "Report incident" },
  { icon: FileUp, label: "Upload document" },
] as const;

export function QuickActionsPanel(): React.JSX.Element {
  const [isAssignDriverOpen, setIsAssignDriverOpen] = React.useState(false);

  return (
    <>
      <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-ink-900">Quick actions</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {quickActions.map(({ icon: Icon, label }) => (
            <Button
              className="h-17 flex-col gap-2 rounded-lg text-ink-900"
              key={label}
              onClick={
                label === "Assign driver"
                  ? () => setIsAssignDriverOpen(true)
                  : undefined
              }
              type="button"
              variant="outline"
            >
              <Icon className="size-5" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </article>

      <AssignDriverQuickActionDialog
        isOpen={isAssignDriverOpen}
        onOpenChange={setIsAssignDriverOpen}
      />
    </>
  );
}
