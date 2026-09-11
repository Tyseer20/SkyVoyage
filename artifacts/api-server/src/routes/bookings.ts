import { asc, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { CreateBookingBody, CreateBookingResponse, GetBookingSummaryResponse, ListBookingsResponse } from "@workspace/api-zod";
import { db, flightBookingsTable } from "@workspace/db";
import { ensureUser, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function toBooking(row: typeof flightBookingsTable.$inferSelect) {
  return {
    type: "flight" as const,
    flightId: row.flightId,
    airline: row.airline,
    route: row.route,
    travelDate: row.travelDate,
    returnDate: row.returnDate,
    passengerCount: row.passengerCount,
    passenger: {
      fullName: row.passengerFullName,
      email: row.passengerEmail,
      phone: row.passengerPhone,
      documentNumber: row.passengerDocument,
    },
    subtotal: Number(row.subtotal),
    taxes: Number(row.taxes),
    total: Number(row.total),
    id: String(row.id),
    reference: row.reference,
    status: row.status === "pending" ? "pending" as const : "confirmed" as const,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/bookings", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(flightBookingsTable)
    .where(eq(flightBookingsTable.clerkUserId, res.locals.userId))
    .orderBy(desc(flightBookingsTable.travelDate), desc(flightBookingsTable.createdAt));
  res.json(ListBookingsResponse.parse(rows.map(toBooking)));
});

router.post("/bookings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const input = parsed.data;
  await ensureUser(req, input.passenger.email, input.passenger.fullName, input.passenger.phone);
  const [row] = await db.insert(flightBookingsTable).values({
    clerkUserId: res.locals.userId,
    reference: `SV${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    flightId: input.flightId,
    airline: input.airline,
    route: input.route,
    travelDate: input.travelDate,
    returnDate: input.returnDate ?? null,
    passengerCount: input.passengerCount,
    passengerFullName: input.passenger.fullName,
    passengerEmail: input.passenger.email,
    passengerPhone: input.passenger.phone,
    passengerDocument: input.passenger.documentNumber,
    subtotal: String(input.subtotal),
    taxes: String(input.taxes),
    total: String(input.total),
    status: "pending",
  }).returning();
  res.status(201).json(CreateBookingResponse.parse(toBooking(row)));
});

router.get("/bookings/summary", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(flightBookingsTable)
    .where(eq(flightBookingsTable.clerkUserId, res.locals.userId))
    .orderBy(asc(flightBookingsTable.travelDate));
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows.filter((row) => row.travelDate >= today);
  const next = upcoming[0] ?? null;
  res.json(GetBookingSummaryResponse.parse({
    upcomingCount: upcoming.length,
    confirmedCount: rows.filter((row) => row.status === "confirmed").length,
    totalSpent: rows.reduce((sum, row) => sum + Number(row.total), 0),
    nextTrip: next ? { reference: next.reference, route: next.route, travelDate: next.travelDate, status: next.status } : null,
  }));
});

export default router;