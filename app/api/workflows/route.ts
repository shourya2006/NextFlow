import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { workflowCreateSchema } from '@/lib/schemas';

export async function GET() {
  try {
    const { userId } = await auth();

    const defaultWorkflow = {
      id: 'default',
      title: 'Default Workflow',
      updatedAt: new Date(0).toISOString()
    };

    if (!userId) {
      return NextResponse.json([]);
    }

    const workflows = await prisma.workflow.findMany({
      where: {
        userId: userId,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json([defaultWorkflow, ...workflows]);
  } catch (error) {
    console.error("Failed to fetch workflows:", error);
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const parsed = workflowCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const workflow = await prisma.workflow.create({
      data: {
        title: parsed.data.title,
        nodes: parsed.data.nodes,
        edges: parsed.data.edges,
        userId: userId,
      }
    });
    
    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Failed to create workflow:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
