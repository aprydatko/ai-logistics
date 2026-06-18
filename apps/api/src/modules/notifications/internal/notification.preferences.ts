import type { UpdateNotificationPreferenceDto } from "@repo/shared/src";

import type { NotificationPreferenceRecord } from "../../../db/schema";

/**
 * Default notification preferences applied to a user the first time a
 * preference record is created.
 *
 * `system` notifications default to in-app disabled because they are
 * low-signal maintenance messages; everything else is in-app enabled
 * (matching the original product behavior). Email is opt-in per category
 * to avoid noisy digests.
 */
export const defaultPreferenceInput: UpdateNotificationPreferenceDto = {
  emailFrequency: "off",
  ai: { emailEnabled: false, inAppEnabled: true },
  documents: { emailEnabled: false, inAppEnabled: true },
  drivers: { emailEnabled: false, inAppEnabled: true },
  incidents: { emailEnabled: false, inAppEnabled: true },
  loads: { emailEnabled: false, inAppEnabled: true },
  system: { emailEnabled: false, inAppEnabled: false },
};

/**
 * Backfill marker: historically documents notifications were off for users
 * that never touched the preferences screen. The product team later decided
 * documents should default to in-app on. This record shape identifies those
 * legacy rows so we can upgrade them in place on first read.
 */
export function isLegacyDocumentsOffRecord(
  record: NotificationPreferenceRecord,
): boolean {
  return (
    record.documentsInAppEnabled === false &&
    record.documentsEmailEnabled === false &&
    record.aiInAppEnabled === defaultPreferenceInput.ai.inAppEnabled &&
    record.aiEmailEnabled === defaultPreferenceInput.ai.emailEnabled &&
    record.driversInAppEnabled ===
      defaultPreferenceInput.drivers.inAppEnabled &&
    record.driversEmailEnabled ===
      defaultPreferenceInput.drivers.emailEnabled &&
    record.incidentsInAppEnabled ===
      defaultPreferenceInput.incidents.inAppEnabled &&
    record.incidentsEmailEnabled ===
      defaultPreferenceInput.incidents.emailEnabled &&
    record.loadsInAppEnabled === defaultPreferenceInput.loads.inAppEnabled &&
    record.loadsEmailEnabled === defaultPreferenceInput.loads.emailEnabled &&
    record.systemInAppEnabled === defaultPreferenceInput.system.inAppEnabled &&
    record.systemEmailEnabled === defaultPreferenceInput.system.emailEnabled &&
    record.emailFrequency === defaultPreferenceInput.emailFrequency
  );
}
