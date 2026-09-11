import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/places/suggestions", async (req, res): Promise<void> => {
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
  if (query.length < 2) {
    res.json({ places: [] });
    return;
  }

  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    res.status(503).json({ error: "Airport search is not configured" });
    return;
  }

  try {
    const response = await fetch(`https://api.duffel.com/places/suggestions?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}`, "Duffel-Version": "v2" },
    });
    if (!response.ok) throw new Error(`Duffel places request failed with ${response.status}`);
    const body = await response.json() as { data?: Array<{ id: string; name: string; city_name?: string | null; iata_code: string; iata_country_code?: string | null; type: "airport" | "city" }> };
    res.json({
      places: (body.data ?? []).slice(0, 8).map((place) => ({
        id: place.id,
        name: place.name,
        cityName: place.city_name ?? place.name,
        iataCode: place.iata_code,
        countryCode: place.iata_country_code ?? "",
        type: place.type,
      })),
    });
  } catch (error) {
    req.log.error({ error }, "Duffel place suggestions failed");
    res.status(502).json({ error: "Airport suggestions are temporarily unavailable" });
  }
});

export default router;
