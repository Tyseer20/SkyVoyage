import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const favoriteDestinationsTable = pgTable(
  "favorite_destinations",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    clerkUserId: text("clerk_user_id").notNull(),
    destinationId: text("destination_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userDestinationUnique: unique().on(table.clerkUserId, table.destinationId),
  }),
);

export type FavoriteDestination = typeof favoriteDestinationsTable.$inferSelect;