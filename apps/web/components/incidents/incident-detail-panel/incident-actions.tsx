import { ChevronDown, ClipboardPen, Phone, Radio, Share2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateIncidentStatus } from "@/lib/incidents/incident-mutations";
import { ActionMenu } from "@repo/ui/components/action-menu";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toaster";

import type { Incident } from "../types";

export const IncidentSummary = ({
  incident,
}: {
  incident: Incident;
}): React.JSX.Element => (
  <section className="mx-5 rounded-md border border-border/70 p-4">
    <h3 className="text-sm font-bold text-primary-700">AI Summary</h3>
    <div className="mt-3 space-y-2 text-sm leading-6 text-primary-700">
      <p>
        {incident.description}
      </p>
      <p>
        <strong className="text-ink-900">Key factors:</strong> sudden
        deceleration, impact detected, airbag deployed.
      </p>
      <p>
        <strong className="text-ink-900">Recommended next step:</strong> contact
        driver and emergency services.
      </p>
    </div>
  </section>
);

export const IncidentActions = ({
  incident,
}: {
  incident: Incident;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateIncidentStatus,
    onError: (error) =>
      toast.error("Unable to update status", { description: error.message }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident status updated");
    },
  });

  return (
  <div className="sticky bottom-0 mt-5 grid grid-cols-3 gap-3 border-t border-border bg-card p-5">
    <Button type="button" variant="outline">
      <Phone className="size-4" />
      Contact driver
    </Button>
    <ActionMenu
      align="center"
      ariaLabel="Update incident status"
      items={[
        {
          icon: Radio,
          label: "Investigating",
          onSelect: () => mutation.mutate({ incidentId: incident.id, status: "investigating" }),
        },
        {
          icon: ClipboardPen,
          label: "Monitoring",
          onSelect: () => mutation.mutate({ incidentId: incident.id, status: "monitoring" }),
        },
        {
          icon: ClipboardPen,
          label: "Resolved",
          onSelect: () => mutation.mutate({ incidentId: incident.id, status: "resolved" }),
        },
      ]}
      trigger={
        <Button
          className="w-full bg-primary-700 hover:bg-primary-600"
          type="button"
        >
          Update status
          <ChevronDown className="size-4" />
        </Button>
      }
    />
    <ActionMenu
      ariaLabel="More incident actions"
      items={[
        { icon: Share2, label: "Share incident" },
        { icon: ClipboardPen, label: "Add internal note" },
      ]}
      trigger={
        <Button className="w-full" type="button" variant="outline">
          More actions
          <ChevronDown className="size-4" />
        </Button>
      }
    />
  </div>
  );
};
