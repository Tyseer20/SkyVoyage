import { Router, type IRouter } from "express";
import { SearchFlightsQueryParams, SearchFlightsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

type DuffelSegment = {
  departing_at: string;
  arriving_at: string;
  origin: { iata_code: string; name?: string };
  destination: { iata_code: string; name?: string };
  duration?: string;
  marketing_carrier?: { name?: string; iata_code?: string };
  marketing_carrier_flight_number?: string;
};

function minutesBetween(start: string, end: string) {
  return Math.max(1, Math.round((new Date(end).valueOf() - new Date(start).valueOf()) / 60_000));
}

function formatDuration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

function logoColor(code: string) {
  const palette = ["#d9a441", "#17324d", "#b4575e", "#477b75", "#7a6299"];
  return palette[code.charCodeAt(0) % palette.length];
}

async function duffelSearch(criteria: ReturnType<typeof SearchFlightsQueryParams.parse>) {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) throw new Error("DUFFEL_ACCESS_TOKEN is not configured");
  const slices = [{ origin: criteria.origin, destination: criteria.destination, departure_date: criteria.departureDate }];
  if (criteria.tripType === "round-trip" && criteria.returnDate) {
    slices.push({ origin: criteria.destination, destination: criteria.origin, departure_date: criteria.returnDate });
  }
  const response = await fetch("https://api.duffel.com/air/offer_requests", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        slices,
        passengers: Array.from({ length: criteria.passengers }, () => ({ type: "adult" })),
        cabin_class: criteria.cabin === "premium-economy" ? "premium_economy" : criteria.cabin,
        max_connections: criteria.stops === "direct" ? 0 : criteria.stops === "one-stop" ? 1 : undefined,
      },
    }),
  });
  if (!response.ok) throw new Error(`Duffel offer request failed with ${response.status}`);
  const request = await response.json() as { data?: { id?: string } };
  if (!request.data?.id) throw new Error("Duffel did not return an offer request");
  const offersResponse = await fetch(`https://api.duffel.com/air/offers?offer_request_id=${request.data.id}&limit=30&sort=total_amount`, {
    headers: { Authorization: `Bearer ${token}`, "Duffel-Version": "v2" },
  });
  if (!offersResponse.ok) throw new Error(`Duffel offers request failed with ${offersResponse.status}`);
  return (await offersResponse.json() as { data?: Array<{ id: string; total_amount: string; total_currency: string; slices: Array<{ segments: DuffelSegment[] }> }> }).data ?? [];
}

router.get("/flights/search", async (req, res): Promise<void> => {
  const parsed = SearchFlightsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const criteria = parsed.data;
    const offers = await duffelSearch(criteria);
    const flights = offers.map((offer, index) => {
      const segments = offer.slices[0]?.segments ?? [];
      const first = segments[0];
      const last = segments.at(-1) ?? first;
      const carrier = first?.marketing_carrier;
      const duration = minutesBetween(first?.departing_at ?? criteria.departureDate, last?.arriving_at ?? criteria.departureDate);
      const stops = Math.max(0, segments.length - 1);
      const price = Math.round(Number(offer.total_amount) / Math.max(1, criteria.passengers));
      return {
        id: offer.id,
        airline: carrier?.name ?? "Airline partner",
        airlineCode: carrier?.iata_code ?? "SV",
        flightNumber: `${carrier?.iata_code ?? "SV"} ${first?.marketing_carrier_flight_number ?? index + 1}`,
        originCity: first?.origin?.name ?? criteria.origin,
        originCode: first?.origin?.iata_code ?? criteria.origin,
        destinationCity: last?.destination?.name ?? criteria.destination,
        destinationCode: last?.destination?.iata_code ?? criteria.destination,
        departureTime: first ? formatTime(first.departing_at) : "—",
        arrivalTime: last ? formatTime(last.arriving_at) : "—",
        duration: formatDuration(duration),
        stops,
        price,
        cabin: criteria.cabin,
        baggage: criteria.cabin === "economy" ? "Cabin bag included" : "Checked bag included",
        refundable: true,
        departureDate: first ? formatDate(first.departing_at) : criteria.departureDate,
        logoColor: logoColor(carrier?.iata_code ?? "SV"),
      };
    }).filter((flight) => criteria.maxPrice == null || flight.price <= criteria.maxPrice);
    res.json(SearchFlightsResponse.parse({
      flights,
      search: { origin: criteria.origin, destination: criteria.destination, departureDate: criteria.departureDate, returnDate: criteria.returnDate ?? null, tripType: criteria.tripType, passengers: criteria.passengers, cabin: criteria.cabin },
      totalResults: flights.length,
    }));
  } catch (error) {
    req.log.error({ error }, "Duffel flight search failed");
    res.status(502).json({ error: "Live flight search is temporarily unavailable. Please try again." });
  }
});

export default router;