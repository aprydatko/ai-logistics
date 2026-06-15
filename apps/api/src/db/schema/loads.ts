import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { drivers } from "./drivers";

export const loadStatusEnum = pgEnum("load_status", [
  "pending",
  "assigned",
  "in_transit",
  "delivered",
  "cancelled",
]);

type BrokerSnapshot = {
  id: string;
  companyName: string;
  phone: string;
};

export type LoadRoutePoint = {
  label: string;
  latitude: number;
  longitude: number;
};

export type LoadTimelineEvent = {
  title: string;
  description: string;
  dateTime: string;
};

export const loads = pgTable(
  "loads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referenceNumber: varchar("reference_number", { length: 100 }).notNull(),
    pickupAddress: text("pickup_address").notNull(),
    deliveryAddress: text("delivery_address").notNull(),
    pickupDate: timestamp("pickup_date", { withTimezone: true }).notNull(),
    deliveryDate: timestamp("delivery_date", { withTimezone: true }).notNull(),
    weight: integer("weight").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    miles: integer("miles").notNull(),
    notes: text("notes"),
    status: loadStatusEnum("status").default("pending").notNull(),
    broker: jsonb("broker").$type<BrokerSnapshot>().notNull(),
    routePoints: jsonb("route_points")
      .$type<LoadRoutePoint[]>()
      .default([])
      .notNull(),
    timeline: jsonb("timeline")
      .$type<LoadTimelineEvent[]>()
      .default([])
      .notNull(),
    driverId: uuid("driver_id").references(() => drivers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("loads_reference_number_unique").on(table.referenceNumber),
    index("loads_driver_id_idx").on(table.driverId),
    index("loads_pickup_date_idx").on(table.pickupDate),
  ],
);

export type LoadRecord = typeof loads.$inferSelect;
export type NewLoadRecord = typeof loads.$inferInsert;
