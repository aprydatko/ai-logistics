const MAX_DRIVING_HOURS_PER_SHIFT = 11;
const REST_HOURS_BETWEEN_SHIFTS = 10;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export type LoadEtaInput = {
  averageSpeedMph: number;
  miles: number;
  pickupDate: Date;
};

/**
 * Calculates the estimated delivery date for a load.
 *
 * Accounts for mandatory HOS (Hours of Service) regulations: a driver may
 * drive at most 11 hours per shift before a mandatory 10-hour rest period.
 * The total trip duration is computed as driving hours plus rest time for
 * each completed 11-hour shift, then added to the pickup date.
 *
 * @param input - ETA calculation inputs
 * @param input.averageSpeedMph - Expected average speed in miles per hour
 * @param input.miles - Total trip distance in miles
 * @param input.pickupDate - Date/time the load is picked up
 * @returns Estimated delivery Date
 */
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
