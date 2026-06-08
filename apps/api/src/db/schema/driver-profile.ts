import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { drivers } from "./drivers";
import { users } from "./users";

export const driverDocumentTypeEnum = pgEnum("driver_document_type", [
  "license",
  "medical_card",
  "insurance",
  "other",
]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "active",
  "maintenance",
  "inactive",
]);

export const driverActivityTypeEnum = pgEnum("driver_activity_type", [
  "created",
  "updated",
  "status_changed",
  "document_added",
  "vehicle_assigned",
  "trip_assigned",
  "trip_completed",
]);

export const driverDocuments = pgTable(
  "driver_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    driverId: uuid("driver_id")
      .references(() => drivers.id, { onDelete: "cascade" })
      .notNull(),
    type: driverDocumentTypeEnum("type").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    documentNumber: varchar("document_number", { length: 100 }),
    fileUrl: text("file_url"),
    storageKey: text("storage_key"),
    mimeType: varchar("mime_type", { length: 100 }),
    fileSize: bigint("file_size", { mode: "number" }),
    issuedAt: date("issued_at"),
    expiresAt: date("expires_at"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("driver_documents_driver_id_idx").on(table.driverId),
    index("driver_documents_expires_at_idx").on(table.expiresAt),
  ],
);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    unitNumber: varchar("unit_number", { length: 50 }).notNull(),
    type: varchar("type", { length: 50 }).default("truck").notNull(),
    make: varchar("make", { length: 100 }),
    model: varchar("model", { length: 100 }),
    year: integer("year"),
    vin: varchar("vin", { length: 17 }),
    licensePlate: varchar("license_plate", { length: 30 }),
    licenseState: varchar("license_state", { length: 80 }),
    odometerMiles: integer("odometer_miles"),
    status: vehicleStatusEnum("status").default("active").notNull(),
    lastServiceAt: date("last_service_at"),
    nextServiceAt: date("next_service_at"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("vehicles_unit_number_unique").on(table.unitNumber),
    uniqueIndex("vehicles_vin_unique").on(table.vin),
    index("vehicles_status_idx").on(table.status),
  ],
);

export const driverVehicleAssignments = pgTable(
  "driver_vehicle_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    driverId: uuid("driver_id")
      .references(() => drivers.id, { onDelete: "cascade" })
      .notNull(),
    vehicleId: uuid("vehicle_id")
      .references(() => vehicles.id, { onDelete: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    unassignedAt: timestamp("unassigned_at", { withTimezone: true }),
    isPrimary: boolean("is_primary").default(true).notNull(),
  },
  (table) => [
    index("driver_vehicle_assignments_driver_id_idx").on(table.driverId),
    index("driver_vehicle_assignments_vehicle_id_idx").on(table.vehicleId),
  ],
);

export const driverActivity = pgTable(
  "driver_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    driverId: uuid("driver_id")
      .references(() => drivers.id, { onDelete: "cascade" })
      .notNull(),
    type: driverActivityTypeEnum("type").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("driver_activity_driver_id_created_at_idx").on(
      table.driverId,
      table.createdAt,
    ),
  ],
);

export type DriverDocumentRecord = typeof driverDocuments.$inferSelect;
export type VehicleRecord = typeof vehicles.$inferSelect;
export type DriverActivityRecord = typeof driverActivity.$inferSelect;
