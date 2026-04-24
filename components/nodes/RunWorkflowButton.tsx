import { Play } from "lucide-react";
import { useReactFlow, useEdges, useStore } from "@xyflow/react";

export default function RunWorkflowButton({
  nodeId,
  selected,
}: {
  nodeId: string;
  selected?: boolean;
}) {
  const edges = useEdges();
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const nodeCount = useStore((s) => s.nodes.length);

  // root node -> no incoming edge
  const isRoot = !edges.some((e) => e.target === nodeId);

  if (!isRoot) return null;

  const handleRun = async () => {
    const nodes = getNodes();
    const allEdges = getEdges();

    // If it's just a single Text Node, execute it locally in the frontend
    if (nodes.length === 1 && nodes[0].type === "text") {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, output: n.data.text } }
            : n
        )
      );
      return;
    }

    // send the raw graph data to backend
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startNodeId: nodeId,
          nodes: nodes,
          edges: allEdges,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to run workflow");
      }

      const result = await response.json();
      console.log("response:", result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <button
      onClick={handleRun}
      className={`absolute right-[calc(100%+16px)] top-[10px] flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 shadow-lg z-50 whitespace-nowrap ${selected ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <Play className="w-3.5 h-3.5 fill-white" />
      {nodeCount === 1 ||
      getNodes().find((n) => n.id === nodeId)?.type === "llm"
        ? "Run node"
        : "Run workflow"}
    </button>
  );
}
