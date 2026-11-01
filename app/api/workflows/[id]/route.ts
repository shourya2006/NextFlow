import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { workflowUpdateSchema } from '@/lib/schemas';
import { readDefaultWorkflow } from '@/lib/defaultWorkflow';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    const effectiveId = id === 'default' ? `default-${userId}` : id;

    // Signed-out visitors can only see the default template, never a stored row
    const workflow = userId
      ? await prisma.workflow.findUnique({ where: { id: effectiveId } })
      : null;

    if (workflow) {
      if (workflow.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      return NextResponse.json(workflow);
    }

    if (id === 'default') {
      try {
        return NextResponse.json({
          id: 'default',
          title: 'Default Workflow',
          ...(await readDefaultWorkflow()),
          userId: null,
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date(0).toISOString(),
        });
      } catch (err) {
        console.error("Failed to read default workflow data:", err);
        return NextResponse.json({ error: "Default workflow not available" }, { status: 404 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to fetch workflow:", error);
    return NextResponse.json({ error: "Failed to fetch workflow" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const effectiveId = id === 'default' ? `default-${userId}` : id;

    const body = await request.json();
    const parsed = workflowUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.workflow.findUnique({ where: { id: effectiveId } });
    if (existing && existing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    // Only the user's own default workflow can be created through this route
    if (!existing && id !== 'default') {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const data: any = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.nodes !== undefined) data.nodes = parsed.data.nodes;
    if (parsed.data.edges !== undefined) data.edges = parsed.data.edges;
    
    const workflow = await prisma.workflow.upsert({
      where: { id: effectiveId },
      update: data,
      create: {
        id: effectiveId,
        title: parsed.data.title || "Default Workflow",
        // A title-only update (rename) must not replace the template with an empty canvas
        nodes: parsed.data.nodes ?? (await readDefaultWorkflow()).nodes,
        edges: parsed.data.edges ?? (await readDefaultWorkflow()).edges,
        userId: userId,
      }
    });
    
    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Failed to update workflow:", error);
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const effectiveId = id === 'default' ? `default-${userId}` : id;
    
    const existing = await prisma.workflow.findUnique({ where: { id: effectiveId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.workflow.delete({
      where: { id: effectiveId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  }
}

