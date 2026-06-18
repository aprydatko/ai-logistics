import {
  boolean,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  date,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users";

type DriverCoordinates = {
  latitude: number;
  longitude: number;
};

export const driverStatusEnum = pgEnum("driver_status", [
  "available",
  "on_trip",
  "off_duty",
  "maintenance",
]);

export const drivers = pgTable(
  "drivers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    driverCode: varchar("driver_code", { length: 50 }).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    avatarUrl: text("avatar_url"),
    dateOfBirth: date("date_of_birth"),
    address: varchar("address", { length: 255 }),
    hireDate: date("hire_date"),
    licenseType: varchar("license_type", { length: 30 }),
    licenseNumber: varchar("license_number", { length: 80 }),
    licenseExpirationDate: date("license_expiration_date"),
    licenseState: varchar("license_state", { length: 80 }),
    emergencyContact: varchar("emergency_contact", { length: 200 }),
    emergencyPhone: varchar("emergency_phone", { length: 30 }),
    notes: text("notes"),
    rating: numeric("rating", { precision: 2, scale: 1 })
      .default("4.8")
      .notNull(),
    truckNumber: varchar("truck_number", { length: 50 }),
    trailerNumber: varchar("trailer_number", { length: 50 }),
    isActive: boolean("is_active").default(true).notNull(),
    status: driverStatusEnum("status").default("available").notNull(),
    currentLocation: jsonb("current_location").$type<DriverCoordinates>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("drivers_user_id_unique").on(table.userId),
    uniqueIndex("drivers_driver_code_unique").on(table.driverCode),
    uniqueIndex("drivers_email_unique").on(table.email),
    uniqueIndex("drivers_truck_number_unique").on(table.truckNumber),
    uniqueIndex("drivers_trailer_number_unique").on(table.trailerNumber),
    index("drivers_is_active_idx").on(table.isActive),
    index("drivers_status_idx").on(table.status),
    index("drivers_is_active_status_name_idx").on(
      table.isActive,
      table.status,
      table.lastName,
      table.firstName,
    ),
  ],
);

export type DriverRecord = typeof drivers.$inferSelect;
export type NewDriverRecord = typeof drivers.$inferInsert;
