import type { DriverDetails } from '@/lib/drivers/drivers-query';

import type { DriverRow } from '../../types';
import type { ProfileTab } from '../profile-header';
import { ActivityTab } from './activity-tab';
import { DocumentsTab } from './documents-tab';
import { ProfileTabView } from './profile-tab';
import { TripsTab } from './trips-tab';
import { TruckTab } from './truck-tab';

type ProfileTabContentProps = {
  activeTab: ProfileTab;
  details: DriverDetails;
  driver: DriverRow;
  onEdit: (driver: DriverRow) => void;
};

export const ProfileTabContent = ({
  activeTab,
  details,
  driver,
  onEdit,
}: ProfileTabContentProps): React.JSX.Element => {
  if (activeTab === 'Profile') {
    return (
      <ProfileTabView details={details} driver={driver} onEdit={onEdit} />
    );
  }

  if (activeTab === 'Truck') return <TruckTab details={details} />;
  if (activeTab === 'Docs') return <DocumentsTab details={details} />;
  if (activeTab === 'Trips') return <TripsTab details={details} />;

  return <ActivityTab details={details} />;
};
