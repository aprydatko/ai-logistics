'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  FileText,
  ListChecks,
  MessageSquareText,
  Paperclip,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { toast } from '@repo/ui/components/toaster';

import { saveIncident } from '@/lib/incidents/incident-mutations';
import type { IncidentTimelineEvent } from '@/lib/incidents/incidents-query';
import { loadsQueryOptions } from '@/lib/loads/loads-query';
import type { Incident } from '../types';
import {
  emptyIncidentFormValues,
  toIncidentFormValues,
  type IncidentFormValues,
} from './form-values';
import { OverviewTab } from './overview-tab';
import { TimelineTab } from './timeline-tab';

type IncidentsFormDialogProps = {
  incident: Incident | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

type IncidentFormTab =
  | 'overview'
  | 'timeline'
  | 'files'
  | 'updates'
  | 'activities';

const tabs: Array<{
  id: IncidentFormTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}> = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: ListChecks },
  { id: 'files', label: 'Files', icon: Paperclip, count: 0 },
  { id: 'updates', label: 'Updates', icon: MessageSquareText, count: 0 },
  { id: 'activities', label: 'Activities', icon: Activity, count: 0 },
];

export const IncidentsFormDialog = ({
  incident,
  isOpen,
  onOpenChange,
}: IncidentsFormDialogProps): React.JSX.Element => {
  const queryClient = useQueryClient();
  const loadsQuery = useQuery(
    loadsQueryOptions({
      search: '',
      status: 'all',
      pickupFrom: '',
      pickupTo: '',
      page: 1,
      limit: 100,
    })
  );
  const mutation = useMutation({
    mutationFn: saveIncident,
    onError: (error) =>
      toast.error('Unable to save incident', { description: error.message }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
      onOpenChange(false);
      toast.success(incident ? 'Incident updated' : 'Incident created');
    },
  });
  const [values, setValues] = React.useState<IncidentFormValues>(
    emptyIncidentFormValues
  );
  const [activeTab, setActiveTab] = React.useState<IncidentFormTab>('overview');
  const [timelineEvents, setTimelineEvents] = React.useState<
    IncidentTimelineEvent[]
  >([]);

  React.useEffect(() => {
    if (!isOpen) return;

    setValues(toIncidentFormValues(incident));
    setTimelineEvents(incident?.timeline ?? []);
    setActiveTab('overview');
  }, [incident, isOpen]);

  const updateValue = <Key extends keyof IncidentFormValues>(
    key: Key,
    value: IncidentFormValues[Key]
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(58rem,calc(100svh-2rem))] max-w-[44rem] flex-col">
        <div className="shrink-0 px-7 pt-6 pr-14">
          <div className="flex items-start gap-4">
            <div>
              <DialogTitle>
                {incident ? 'Edit incident' : 'Create incident'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Add incident details and track progress.
              </DialogDescription>
            </div>
          </div>
          <div className="mt-7 flex gap-5 overflow-x-auto border-b border-border">
            {tabs.map(({ count, icon: Icon, id, label }) => (
              <button
                className={`flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-primary-700'
                }`}
                onClick={() => setActiveTab(id)}
                key={label}
                type="button"
              >
                <Icon className="size-4" />
                {label}
                {count !== undefined ? (
                  <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs">
                    {count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({
              incidentId: incident?.id,
              timeline: timelineEvents,
              values,
            });
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
            {activeTab === 'overview' ? (
              <OverviewTab
                loads={loadsQuery.data?.data ?? []}
                onChange={updateValue}
                values={values}
              />
            ) : null}
            {activeTab === 'timeline' ? (
              <TimelineTab
                events={timelineEvents}
                occurredAt={values.occurredAt}
                onEventsChange={setTimelineEvents}
              />
            ) : null}
            {activeTab !== 'overview' && activeTab !== 'timeline' ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                <p className="text-base font-bold text-ink-900">
                  {tabs.find(({ id }) => id === activeTab)?.label}
                </p>
                <p className="mt-2 max-w-sm text-sm text-primary-700">
                  No incident data has been added to this section yet.
                </p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-7 py-5">
            <div>
              {incident ? (
                <span className="text-xs text-primary-700">
                  ID: {incident.id}
                </span>
              ) : null}
            </div>
            <div className="flex gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                className="bg-primary-700 hover:bg-primary-600"
                type="submit"
              >
                {mutation.isPending
                  ? 'Saving...'
                  : incident
                    ? 'Save changes'
                    : 'Save incident'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
