import { ActivityPanel } from "./activity-panel";
import { IncidentsPanel } from "./incidents-panel";
import { MapPlaceholder } from "./map-placeholder";
import { QuickActionsPanel } from "./quick-actions-panel";
import { SuggestionsPanel } from "./suggestions-panel";

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
