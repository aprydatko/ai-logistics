const MAX_DRIVING_HOURS_PER_SHIFT = 11;
const REST_HOURS_BETWEEN_SHIFTS = 10;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export type LoadEtaInput = {
  averageSpeedMph: number;
  miles: number;
  pickupDate: Date;
};

export const calculateLoadEta = ({
  averageSpeedMph,
  miles,
  pickupDate,
}: LoadEtaInput): Date => {
  const drivingHours = miles / averageSpeedMph;
  const completedShifts = Math.max(
    0,
    Math.ceil(drivingHours / MAX_DRIVING_HOURS_PER_SHIFT) - 1,
  );
  const totalHours = drivingHours + completedShifts * REST_HOURS_BETWEEN_SHIFTS;

  return new Date(pickupDate.getTime() + totalHours * MILLISECONDS_PER_HOUR);
};
