import { AlertTriangle, FileUp, PackagePlus, UserRoundCheck } from 'lucide-react';

import { Button } from '@repo/ui/components/button';
import { RouteMap, type RouteMapMarker } from '@repo/ui/components/route-map';

import { ActivityPanel } from './activity-panel';
import { IncidentsPanel } from './incidents-panel';
import { SuggestionsPanel } from './suggestions-panel';

const quickActions = [
  { icon: UserRoundCheck, label: 'Assign driver' },
  { icon: PackagePlus, label: 'Create load' },
  { icon: AlertTriangle, label: 'Report incident' },
  { icon: FileUp, label: 'Upload document' },
];

const activeLoadRoute: [number, number][] = [
  [-88.218, 41.761],
  [-88.118, 41.849],
  [-88.015, 41.849],
  [-87.897, 41.884],
  [-87.782, 41.878],
  [-87.704, 41.79],
  [-87.689, 41.66],
  [-87.527, 41.603],
];

const activeLoadMarkers: RouteMapMarker[] = [
  {
    coordinates: [-88.218, 41.761],
    id: 'load-78288',
    label: 'Load LO-78288 near Aurora',
  },
  {
    coordinates: [-88.015, 41.849],
    id: 'load-78291',
    label: 'Load LO-78291 near Downers Grove',
    tone: 'warning',
  },
  {
    coordinates: [-87.897, 41.884],
    id: 'load-10456',
    label: 'Load LO-10456 near Elmhurst',
  },
  {
    coordinates: [-87.704, 41.79],
    id: 'load-2156',
    label: 'Load LD-2156 in Chicago',
  },
  {
    coordinates: [-87.527, 41.603],
    id: 'load-1042',
    label: 'Load LO-1042 near Hammond',
  },
];

function PanelTitle({
  action,
  children,
}: {
  action?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-sm font-bold text-ink-900">{children}</h2>
      {action ? (
        <Button className="h-auto p-0 text-blue-600" variant="link">
          {action}
        </Button>
      ) : null}
    </div>
  );
}

function MapPlaceholder(): React.JSX.Element {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <PanelTitle>Active loads map</PanelTitle>
      <RouteMap
        center={[-87.86, 41.78]}
        className="mt-3"
        markers={activeLoadMarkers}
        route={activeLoadRoute}
      />
    </article>
  );
}

function QuickActionsPanel(): React.JSX.Element {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <PanelTitle>Quick actions</PanelTitle>
      <div className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {quickActions.map(({ icon: Icon, label }) => (
          <Button
            className="h-17 flex-col gap-2 rounded-lg text-ink-900"
            key={label}
            variant="outline"
          >
            <Icon className="size-5" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </article>
  );
}

export function DashboardPanels(): React.JSX.Element {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1.05fr_1fr]">
      <div className="grid gap-5">
        <MapPlaceholder />
        <ActivityPanel />
      </div>
      <div className="grid gap-5">
        <IncidentsPanel />
        <QuickActionsPanel />
        <SuggestionsPanel />
      </div>
    </div>
  );
}
