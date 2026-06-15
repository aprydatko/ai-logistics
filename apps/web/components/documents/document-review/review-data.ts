"use client";

import type { Document, DocumentAuditEvent } from "@repo/shared";
import type { LucideIcon } from "lucide-react";
import { Bot, FileDown, Link2, UserRound } from "lucide-react";

export const formatProcessingTime = (milliseconds: number | null): string => {
  if (milliseconds === null) return "Not available";
  return `${Math.round(milliseconds / 100) / 10} sec`;
};

export type AuditEventTone = "green" | "navy" | "violet";

export type AuditEvent = {
  actor: string;
  actorBadge: string;
  kind: DocumentAuditEvent["kind"];
  icon: LucideIcon;
  label: string;
  role: string;
  timestamp: string | null;
  tone: AuditEventTone;
};

export const formatUploadedAt = (uploadedAt: Document["uploadedAt"]): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(uploadedAt));

const getInitials = (firstName: string, lastName: string): string =>
  `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "NA";

const getUploaderName = (document: Document): string =>
  document.uploadedBy
    ? `${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`
    : "Unknown uploader";

const getAuditEventIcon = (kind: DocumentAuditEvent["kind"]): LucideIcon =>
  ({
    uploaded: FileDown,
    ai_extraction: Bot,
    load_link: Link2,
    driver_link: UserRound,
    custom: FileDown,
  })[kind];

export const getAuditEvents = (document: Document): AuditEvent[] => {
  if (document.auditEvents.length > 0) {
    return document.auditEvents.map((event) => ({
      actor: event.actor,
      actorBadge: event.actorBadge,
      kind: event.kind,
      icon: getAuditEventIcon(event.kind),
      label: event.label,
      role: event.role,
      timestamp: event.timestamp,
      tone: event.tone,
    }));
  }

  const uploaderName = getUploaderName(document);
  const uploaderBadge = document.uploadedBy
    ? getInitials(document.uploadedBy.firstName, document.uploadedBy.lastName)
    : "NA";

  const events: AuditEvent[] = [
    {
      actor: uploaderName,
      actorBadge: uploaderBadge,
      kind: "uploaded",
      icon: FileDown,
      label: "Document uploaded",
      role: "Uploader",
      timestamp: document.uploadedAt,
      tone: "navy",
    },
  ];

  if (document.status === "complete" || document.extractionModel) {
    events.push({
      actor: "AI Engine",
      actorBadge: "AI",
      kind: "ai_extraction",
      icon: Bot,
      label: "AI extraction completed",
      role: document.extractionModel ?? "Document Extractor",
      timestamp: document.updatedAt,
      tone: "violet",
    });
  }

  if (document.load) {
    events.push({
      actor: uploaderName,
      actorBadge: uploaderBadge,
      kind: "load_link",
      icon: Link2,
      label: `Linked to load ${document.load.referenceNumber}`,
      role: "Load association",
      timestamp: document.updatedAt,
      tone: "navy",
    });
  }

  if (document.driver) {
    events.push({
      actor: uploaderName,
      actorBadge: uploaderBadge,
      kind: "driver_link",
      icon: UserRound,
      label: `Linked to driver ${document.driver.firstName} ${document.driver.lastName}`,
      role: "Driver association",
      timestamp: document.updatedAt,
      tone: "green",
    });
  }

  return events;
};
