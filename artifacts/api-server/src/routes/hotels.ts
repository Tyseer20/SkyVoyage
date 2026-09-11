import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { CreateHotelBookingBody, CreateHotelBookingResponse, ListHotelBookingsResponse, SearchHotelsQueryParams, SearchHotelsResponse } from "@workspace/api-zod";
import { db, hotelBookingsTable } from "@workspace/db";
import { ensureUser, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const inventory = [
  ["hotel-lisbon-alfama", "Memmo Alfama", "Lisbon", "Portugal", 4.8, 164, ["Rooftop pool", "Breakfast included", "City views"], "#d9a441"],
  ["hotel-london-covent", "The Resident Covent Garden", "London", "United Kingdom", 4.7, 238, ["Kitchenette", "24h concierge", "Walkable"], "#476a88"],
  ["hotel-paris-marais", "Les Jardins du Marais", "Paris", "France", 4.6, 212, ["Garden courtyard", "Spa", "Breakfast included"], "#9c5e63"],
  ["hotel-tokyo-ginza", "The Gate Hotel Tokyo", "Tokyo", "Japan", 4.9, 276, ["Sky bar", "Rail access", "Late checkout"], "#587f78"],
  ["hotel-dubai-creek", "Vida Creek Harbour", "Dubai", "United Arab Emirates", 4.5, 143, ["Pool", "Airport transfer", "Gym"], "#b17c43"],
] as const;

function nights(checkIn: string, checkOut: string) {
  const value = Math.max(1, Math.ceil((new Date(checkOut).valueOf() - new Date(checkIn).valueOf()) / 86_400_000));
  return Number.isFinite(value) ? value : 1;
}

router.get("/hotels/search", (req, res): void => {
  const parsed = SearchHotelsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const criteria = parsed.data;
  const result = inventory
    .filter((hotel) => hotel[2].toLowerCase().includes(criteria.destination.toLowerCase()) || criteria.destination.toLowerCase() === hotel[0].split("-").at(-1))
    .map((hotel, index) => ({
      id: hotel[0],
      name: hotel[1],
      destination: hotel[2],
      country: hotel[3],
      rating: hotel[4],
      nightlyRate: hotel[5],
      totalPrice: hotel[5] * nights(criteria.checkIn, criteria.checkOut),
      amenities: hotel[6],
      imageUrl: "",
      refundable: index !== 2,
      checkIn: criteria.checkIn,
      checkOut: criteria.checkOut,
      guests: criteria.guests,
    }))
    .filter((hotel) => criteria.maxPrice == null || hotel.totalPrice <= criteria.maxPrice)
    .filter((hotel) => criteria.minRating == null || hotel.rating >= criteria.minRating);
  res.json(SearchHotelsResponse.parse({ hotels: result, totalResults: result.length }));
});

router.get("/hotel-bookings", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(hotelBookingsTable).where(eq(hotelBookingsTable.clerkUserId, res.locals.userId)).orderBy(desc(hotelBookingsTable.createdAt));
  res.json(ListHotelBookingsResponse.parse(rows.map((row) => ({
    hotelId: row.hotelId, propertyName: row.propertyName, destination: row.destination, checkIn: row.checkIn, checkOut: row.checkOut,
    guestCount: row.guestCount, guest: { fullName: row.guestFullName, email: row.guestEmail, phone: row.guestPhone, documentNumber: row.guestDocument },
    total: Number(row.total), id: String(row.id), reference: row.reference, status: row.status === "pending" ? "pending" : "confirmed", createdAt: row.createdAt.toISOString(),
  }))));
});

router.post("/hotel-bookings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateHotelBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const input = parsed.data;
  await ensureUser(req, input.guest.email, input.guest.fullName, input.guest.phone);
  const reference = `SVH${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [row] = await db.insert(hotelBookingsTable).values({
    clerkUserId: res.locals.userId, reference, propertyName: input.propertyName, hotelId: input.hotelId, destination: input.destination,
    checkIn: input.checkIn, checkOut: input.checkOut, guestCount: input.guestCount, guestFullName: input.guest.fullName,
    guestEmail: input.guest.email, guestPhone: input.guest.phone, guestDocument: input.guest.documentNumber, total: String(input.total), status: "pending",
  }).returning();
  res.status(201).json(CreateHotelBookingResponse.parse({
    hotelId: row.hotelId, propertyName: row.propertyName, destination: row.destination, checkIn: row.checkIn, checkOut: row.checkOut,
    guestCount: row.guestCount, guest: { fullName: row.guestFullName, email: row.guestEmail, phone: row.guestPhone, documentNumber: row.guestDocument },
    total: Number(row.total), id: String(row.id), reference: row.reference, status: "pending", createdAt: row.createdAt.toISOString(),
  }));
});

export default router;