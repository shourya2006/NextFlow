import { NextResponse } from "next/server";
import { tasks, runs } from "@trigger.dev/sdk/v3";
import { workflowRunSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = workflowRunSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid run payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.log("Starting Node:", parsed.data.startNodeId);
    console.log("Nodes Count:", parsed.data.nodes.length);

    // Pass the app's base URL so the trigger task can call back to our API
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const handle = await tasks.trigger("workflow-run", {
      ...parsed.data,
      baseUrl,
    });
    
    const run = await runs.poll(handle.id);

    return NextResponse.json({ 
      success: run.status === "COMPLETED", 
      message: "Graph Data Received and Task Completed",
      result: run.output
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process" }, { status: 500 });
  }
}
