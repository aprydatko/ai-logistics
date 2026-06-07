import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users";

type DriverCoordinates = {
  latitude: number;
  longitude: number;
};

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
    currentLocation: jsonb("current_location").$type<DriverCoordinates>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("drivers_user_id_idx").on(table.userId),
    index("drivers_is_active_idx").on(table.isActive),
    index("drivers_truck_number_idx").on(table.truckNumber),
  ],
);

export type DriverRecord = typeof drivers.$inferSelect;
export type NewDriverRecord = typeof drivers.$inferInsert;
