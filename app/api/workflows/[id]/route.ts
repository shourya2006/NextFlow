import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { workflowUpdateSchema } from '@/lib/schemas';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (id === 'default') {
      try {
        const nodesData = await fs.readFile(path.join(process.cwd(), 'data', 'nodes.json'), 'utf-8');
        const edgesData = await fs.readFile(path.join(process.cwd(), 'data', 'edges.json'), 'utf-8');
        return NextResponse.json({
          id: 'default',
          title: 'Default Workflow',
          nodes: JSON.parse(nodesData),
          edges: JSON.parse(edgesData),
          userId: null,
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date(0).toISOString(),
        });
      } catch (err) {
        console.error("Failed to read default workflow data:", err);
        return NextResponse.json({ error: "Default workflow not available" }, { status: 404 });
      }
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id }
    });
    
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (workflow.userId !== null && workflow.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    return NextResponse.json(workflow);
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

    if (id === 'default') {
      return NextResponse.json({ error: "Cannot modify default workflow" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = workflowUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (existing && existing.userId !== null && existing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const data: any = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.nodes !== undefined) data.nodes = parsed.data.nodes;
    if (parsed.data.edges !== undefined) data.edges = parsed.data.edges;
    
    const workflow = await prisma.workflow.upsert({
      where: { id },
      update: {
        ...data,
        userId: existing?.userId || userId || null,
      },
      create: {
        id,
        title: parsed.data.title || "Untitled",
        nodes: parsed.data.nodes || [],
        edges: parsed.data.edges || [],
        userId: userId || null,
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

    if (id === 'default') {
      return NextResponse.json({ error: "Cannot delete default workflow" }, { status: 403 });
    }
    
    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.userId !== null && existing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.workflow.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  }
}
