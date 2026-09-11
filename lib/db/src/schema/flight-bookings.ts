import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const flightBookingsTable = pgTable("flight_bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clerkUserId: text("clerk_user_id"),
  reference: text("reference").notNull().unique(),
  flightId: text("flight_id").notNull(),
  airline: text("airline").notNull(),
  route: text("route").notNull(),
  travelDate: text("travel_date").notNull(),
  returnDate: text("return_date"),
  passengerCount: integer("passenger_count").notNull(),
  passengerFullName: text("passenger_full_name").notNull(),
  passengerEmail: text("passenger_email").notNull(),
  passengerPhone: text("passenger_phone").notNull(),
  passengerDocument: text("passenger_document").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxes: numeric("taxes", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type InsertFlightBooking = typeof flightBookingsTable.$inferInsert;
export type FlightBooking = typeof flightBookingsTable.$inferSelect;