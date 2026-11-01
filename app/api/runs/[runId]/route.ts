import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// GET /api/runs/:runId — Fetch run with nodeRuns (used for real-time polling)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { runId } = await params;

    const run = await prisma.workflowRun.findUnique({
      where: { id: runId },
      include: {
        nodeRuns: {
          orderBy: { executionOrder: "asc" },
        },
      },
    });

    if (!run || run.userId !== userId) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Failed to fetch run:", error);
    return NextResponse.json(
      { error: "Failed to fetch run" },
      { status: 500 }
    );
  }
}

// PUT /api/runs/:runId — Update a run (status, endedAt, durationMs)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { runId } = await params;
    const body = await req.json();

    const existing = await prisma.workflowRun.findUnique({
      where: { id: runId },
      select: { userId: true },
    });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const run = await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: body.status,
        endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
        durationMs: body.durationMs,
      },
    });

    return NextResponse.json(run);
  } catch (error) {
    console.error("Failed to update run:", error);
    return NextResponse.json(
      { error: "Failed to update run" },
      { status: 500 }
    );
  }
}
