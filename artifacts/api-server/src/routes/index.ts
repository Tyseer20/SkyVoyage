import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import catalogRouter from "./catalog.js";
import flightsRouter from "./flights.js";
import bookingsRouter from "./bookings.js";
import hotelsRouter from "./hotels.js";
import tripsRouter from "./trips.js";
import paymentsRouter from "./payments.js";
import placesRouter from "./places.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catalogRouter);
router.use(flightsRouter);
router.use(bookingsRouter);
router.use(hotelsRouter);
router.use(placesRouter);
router.use(tripsRouter);
router.use(paymentsRouter);

export default router;