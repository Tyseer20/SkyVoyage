import { Router, type IRouter } from "express";
import healthRouter from "./health";
import catalogRouter from "./catalog";
import flightsRouter from "./flights";
import bookingsRouter from "./bookings";
import hotelsRouter from "./hotels";
import tripsRouter from "./trips";
import paymentsRouter from "./payments";
import placesRouter from "./places";

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
