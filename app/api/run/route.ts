import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Starting Node:", body.startNodeId);
    console.log("Graph:", JSON.stringify(body.orderedNodes, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: "Graph Data Recieved",
      receivedNodesCount: body.orderedNodes?.length || 0
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process" }, { status: 500 });
  }
}
