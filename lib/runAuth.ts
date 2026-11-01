import { createHmac, timingSafeEqual } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Trigger.dev workers have no Clerk session, so each run gets a token scoped to
 * its ID. Only the Next.js server holds the key, so the worker needs no new env.
 */
export function signRunToken(runId: string): string {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error("Missing CLERK_SECRET_KEY");
  return createHmac("sha256", secret).update(`run-callback:${runId}`).digest("hex");
}

function hasValidRunToken(req: Request, runId: string): boolean {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(signRunToken(runId));
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

/** True if the request is from the worker for this run, or from the run's owner. */
export async function canWriteRun(req: Request, runId: string): Promise<boolean> {
  if (hasValidRunToken(req, runId)) return true;

  const { userId } = await auth();
  if (!userId) return false;

  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    select: { userId: true },
  });
  return run?.userId === userId;
}
