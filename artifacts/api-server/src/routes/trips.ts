import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  AddFavoriteDestinationBody,
  AddFavoriteDestinationResponse,
  CreateSavedTripBody,
  CreateSavedTripResponse,
  DeleteSavedTripResponse,
  ListFavoriteDestinationsResponse,
  ListSavedTripsResponse,
  RemoveFavoriteDestinationResponse,
} from "@workspace/api-zod";
import {
  db,
  favoriteDestinationsTable,
  savedTripsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/saved-trips", async (_req, res) => {
  const rows = await db
    .select()
    .from(savedTripsTable)
    .where(eq(savedTripsTable.clerkUserId, res.locals.userId))
    .orderBy(desc(savedTripsTable.createdAt));

  res.json(
    ListSavedTripsResponse.parse(
      rows.map((row) => ({
        id: String(row.id),
        title: row.title,
        kind: row.kind,
        payload: row.payload,
        createdAt: row.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/saved-trips", async (req, res) => {
  const parsed = CreateSavedTripBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(savedTripsTable)
    .values({
      clerkUserId: res.locals.userId,
      title: parsed.data.title,
      kind: parsed.data.kind,
      payload: parsed.data.payload,
    })
    .returning();

  res
    .status(201)
    .json(
      CreateSavedTripResponse.parse({
        id: String(row.id),
        title: row.title,
        kind: row.kind,
        payload: row.payload,
        createdAt: row.createdAt.toISOString(),
      }),
    );
});

router.delete("/saved-trips/:id", async (req, res) => {
  await db
    .delete(savedTripsTable)
    .where(
      and(
        eq(savedTripsTable.id, Number(req.params.id)),
        eq(savedTripsTable.clerkUserId, res.locals.userId),
      ),
    );

  res.status(204).json(DeleteSavedTripResponse.parse(undefined));
});

router.get("/favorites", async (_req, res) => {
  const rows = await db
    .select()
    .from(favoriteDestinationsTable)
    .where(
      eq(
        favoriteDestinationsTable.clerkUserId,
        res.locals.userId,
      ),
    )
    .orderBy(desc(favoriteDestinationsTable.createdAt));

  res.json(
    ListFavoriteDestinationsResponse.parse(
      rows.map((row) => ({
        id: String(row.id),
        destinationId: row.destinationId,
        createdAt: row.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/favorites", async (req, res) => {
  const parsed = AddFavoriteDestinationBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(favoriteDestinationsTable)
    .values({
      clerkUserId: res.locals.userId,
      destinationId: parsed.data.destinationId,
    })
    .onConflictDoNothing()
    .returning();

  const saved =
    row ??
    (
      await db
        .select()
        .from(favoriteDestinationsTable)
        .where(
          and(
            eq(
              favoriteDestinationsTable.clerkUserId,
              res.locals.userId,
            ),
            eq(
              favoriteDestinationsTable.destinationId,
              parsed.data.destinationId,
            ),
          ),
        )
        .limit(1)
    )[0];

  res.status(201).json(
    AddFavoriteDestinationResponse.parse({
      id: String(saved.id),
      destinationId: saved.destinationId,
      createdAt: saved.createdAt.toISOString(),
    }),
  );
});

router.delete("/favorites/:destinationId", async (req, res) => {
  await db
    .delete(favoriteDestinationsTable)
    .where(
      and(
        eq(
          favoriteDestinationsTable.clerkUserId,
          res.locals.userId,
        ),
        eq(
          favoriteDestinationsTable.destinationId,
          req.params.destinationId,
        ),
      ),
    );

  res.status(204).json(RemoveFavoriteDestinationResponse.parse(undefined));
});

export default router;