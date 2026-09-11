import { Router, type IRouter } from "express";
import { ListDestinationsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const destinations = [
  {
    id: "dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    airportCode: "DXB",
    tagline: "A city of sky-high ambition",
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=85",
    averageFare: 289,
  },
  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    airportCode: "LHR",
    tagline: "Culture, craft, and classic charm",
    imageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=85",
    averageFare: 612,
  },
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    airportCode: "HND",
    tagline: "The future, with a human pulse",
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=85",
    averageFare: 746,
  },
  {
    id: "paris",
    city: "Paris",
    country: "France",
    airportCode: "CDG",
    tagline: "Make room for the beautiful detour",
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85",
    averageFare: 568,
  },
];

router.get("/destinations", (_req, res): void => {
  res.json(ListDestinationsResponse.parse(destinations));
});

export { destinations };
export default router;