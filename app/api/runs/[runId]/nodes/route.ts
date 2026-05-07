import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/runs/:runId/nodes — Create a node run record
export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const body = await req.json();

    const nodeRun = await prisma.nodeRun.create({
      data: {
        runId,
        nodeId: body.nodeId,
        label: body.label,
        type: body.type,
        status: "running",
        executionOrder: body.executionOrder,
      },
    });

    return NextResponse.json(nodeRun);
  } catch (error) {
    console.error("Failed to create node run:", error);
    return NextResponse.json(
      { error: "Failed to create node run" },
      { status: 500 }
    );
  }
}

// PUT /api/runs/:runId/nodes — Update a node run record
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const body = await req.json();

    // Find the node run by runId + nodeId
    const existing = await prisma.nodeRun.findFirst({
      where: { runId, nodeId: body.nodeId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Node run not found" },
        { status: 404 }
      );
    }

    const nodeRun = await prisma.nodeRun.update({
      where: { id: existing.id },
      data: {
        status: body.status,
        endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
        durationMs: body.durationMs,
        outputSummary: body.outputSummary,
        error: body.error,
      },
    });

    return NextResponse.json(nodeRun);
  } catch (error) {
    console.error("Failed to update node run:", error);
    return NextResponse.json(
      { error: "Failed to update node run" },
      { status: 500 }
    );
  }
}
