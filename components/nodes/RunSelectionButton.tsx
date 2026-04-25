import { Play, Loader2 } from "lucide-react";
import { useState } from "react";
import { useReactFlow, useNodes, useEdges } from "@xyflow/react";
import { useRunStore } from "@/store/runStore";
import type { Node, Edge } from "@xyflow/react";


export default function RunSelectionButton() {
  const { setNodes } = useReactFlow();
  const allNodes = useNodes();
  const allEdges = useEdges();
  const [isRunningLocal, setIsRunningLocal] = useState(false);
  const { setRunningIds, clearRunning } = useRunStore();

  const selectedNodes = allNodes.filter((n) => n.selected);
  const selectedIds = new Set(selectedNodes.map((n) => n.id));

  const selectedEdges = allEdges.filter(
    (e) => selectedIds.has(e.source) && selectedIds.has(e.target)
  );

  if (selectedNodes.length === 0) return null;

  const setRunning = (v: boolean) => {
    setIsRunningLocal(v);
    if (v) {
      setRunningIds(selectedNodes.map((n) => n.id));
    } else {
      clearRunning();
    }
  };

  const findStartNode = (nodes: Node[], edges: Edge[]): string => {
    const targets = new Set(edges.map((e) => e.target));
    const root = nodes.find((n) => !targets.has(n.id));
    return root?.id ?? nodes[0].id;
  };

  const handleRunSelection = async () => {
    if (isRunningLocal) return;
    setRunning(true);
    try {
      const startNodeId = findStartNode(selectedNodes, selectedEdges);

      const currentNodes = selectedNodes.map((n) => {
        if (n.type === "text" && !selectedEdges.some((e) => e.target === n.id)) {
          return { ...n, data: { ...n.data, output: n.data.text } };
        }
        return n;
      });

      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startNodeId,
          nodes: currentNodes,
          edges: selectedEdges,
        }),
      });

      if (!response.ok) throw new Error("Failed to run selection");

      const result = await response.json();

      if (result.success && result.result?.executionOrder) {
        const executedNodes: Node[] = result.result.executionOrder;
        setNodes((prev) =>
          prev.map((node) => {
            const executed = executedNodes.find((en) => en.id === node.id);
            return executed ? { ...node, data: executed.data } : node;
          })
        );
      }
    } catch (err) {
      console.error("Run selection failed", err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <button
      onClick={handleRunSelection}
      disabled={isRunningLocal}
      title={`Run ${selectedNodes.length} selected node${selectedNodes.length > 1 ? "s" : ""}`}
      className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-[13px] font-medium transition-all
        ${isRunningLocal
          ? "bg-amber-500/20 text-amber-400 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-500 text-white"
        }`}
    >
      {isRunningLocal ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Play className="w-3.5 h-3.5 fill-white" />
      )}
      <span className="hidden sm:inline">
        {isRunningLocal ? "Running…" : `Run ${selectedNodes.length}`}
      </span>
    </button>
  );
}
