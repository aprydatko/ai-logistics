import { Activity } from 'lucide-react';

import type { DriverDetails } from '@/lib/drivers/drivers-query';

import { EmptyTab, PanelSection } from '../panel-section';
import { formatTimestamp } from '../profile-formatters';

export const ActivityTab = ({
  details,
}: {
  details: DriverDetails;
}): React.JSX.Element => {
  if (!details.activity.length) return <EmptyTab label="Activity" />;

  return (
    <PanelSection title="Recent activity">
      <div className="divide-y divide-border/70 px-4">
        {details.activity.map((item) => (
          <div className="flex gap-3 py-3" key={item.id}>
            <Activity className="mt-0.5 size-4 text-primary-700" />
            <div>
              <p className="text-sm font-medium">{item.description}</p>
              <p className="text-xs text-primary-700">
                {formatTimestamp(item.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </PanelSection>
  );
};
