import { getAuth } from "@clerk/express";
import type { RequestHandler, Request } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function getUserId(req: Request): string | null {
  return getAuth(req).userId ?? null;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  res.locals.userId = userId;
  next();
};

export async function ensureUser(req: Request, email: string, fullName: string, phone?: string) {
  const clerkUserId = getUserId(req);
  if (!clerkUserId) return null;
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, clerkUserId)).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await db.insert(usersTable).values({ clerkUserId, email, fullName, phone }).onConflictDoNothing().returning();
  return created ?? null;
}