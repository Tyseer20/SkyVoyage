import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const hotelBookingsTable = pgTable("hotel_bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clerkUserId: text("clerk_user_id"),
  reference: text("reference").notNull().unique(),
  hotelId: text("hotel_id").notNull(),
  propertyName: text("property_name").notNull(),
  destination: text("destination").notNull(),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  guestCount: integer("guest_count").notNull(),
  guestFullName: text("guest_full_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),
  guestDocument: text("guest_document").notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type InsertHotelBooking = typeof hotelBookingsTable.$inferInsert;
export type HotelBooking = typeof hotelBookingsTable.$inferSelect;