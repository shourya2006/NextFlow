import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { readDefaultWorkflow } from "@/lib/defaultWorkflow";

// GET /api/runs?workflowId=xxx — Fetch all runs for a workflow
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get("workflowId");

    if (!workflowId) {
      return NextResponse.json(
        { error: "workflowId query param is required" },
        { status: 400 }
      );
    }

    // For default workflow, map to the user-specific ID
    const effectiveId = workflowId === "default" ? `default-${userId}` : workflowId;

    const runs = await prisma.workflowRun.findMany({
      where: { workflowId: effectiveId, workflow: { userId } },
      orderBy: { startedAt: "desc" },
      take: 50,
      include: {
        nodeRuns: {
          orderBy: { executionOrder: "asc" },
        },
      },
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("Failed to fetch runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}

// POST /api/runs — Create a new run
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workflowId } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: "workflowId is required" },
        { status: 400 }
      );
    }

    const effectiveId = workflowId === "default" ? `default-${userId}` : workflowId;

    // Ensure the workflow exists and belongs to this user before creating a run
    const workflow = await prisma.workflow.findUnique({
      where: { id: effectiveId },
    });

    if (workflow) {
      if (workflow.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (workflowId === "default") {
      // The user's default workflow is the only one created on first use
      await prisma.workflow.create({
        data: {
          id: effectiveId,
          title: "Default Workflow",
          userId: userId,
          ...(await readDefaultWorkflow()),
        },
      });
    } else {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: effectiveId,
        userId: userId,
        status: "running",
      },
    });

    return NextResponse.json(run);
  } catch (error) {
    console.error("Failed to create run:", error);
    return NextResponse.json(
      { error: "Failed to create run" },
      { status: 500 }
    );
  }
}
