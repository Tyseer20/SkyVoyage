import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const savedTripsTable = pgTable("saved_trips", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clerkUserId: text("clerk_user_id").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SavedTrip = typeof savedTripsTable.$inferSelect;