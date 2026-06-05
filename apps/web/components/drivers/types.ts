export type DriverStatus = 'On Duty' | 'Off Duty' | 'Break';

export type DriverRow = {
  id: string;
  name: string;
  avatarUrl: string;
  status: DriverStatus;
  truck: string;
  truckState: 'active' | 'idle' | 'break';
  currentLoad: string | null;
  eta: {
    time: string | null;
    state?: 'On time' | 'Delayed';
  };
};
