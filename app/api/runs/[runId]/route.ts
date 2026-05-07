import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/runs/:runId — Update a run (status, endedAt, durationMs)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const body = await req.json();

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
