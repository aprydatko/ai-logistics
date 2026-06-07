import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
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
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    truckNumber: varchar("truck_number", { length: 50 }).notNull(),
    trailerNumber: varchar("trailer_number", { length: 50 }).notNull(),
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
    uniqueIndex("drivers_truck_number_unique").on(table.truckNumber),
    uniqueIndex("drivers_trailer_number_unique").on(table.trailerNumber),
    index("drivers_is_active_idx").on(table.isActive),
    index("drivers_status_idx").on(table.status),
  ],
);

export type DriverRecord = typeof drivers.$inferSelect;
export type NewDriverRecord = typeof drivers.$inferInsert;
