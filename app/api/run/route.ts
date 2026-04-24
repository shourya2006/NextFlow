import { NextResponse } from "next/server";
import { tasks, runs } from "@trigger.dev/sdk/v3";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Starting Node:", body.startNodeId);
    console.log("Nodes Count:", body.nodes?.length);

    // Trigger the task
    const handle = await tasks.trigger("workflow-run", body);
    
    // Poll for completion
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
