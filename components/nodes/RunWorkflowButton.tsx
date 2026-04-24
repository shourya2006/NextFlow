import { Play } from "lucide-react";
import { useReactFlow, useEdges, useStore } from "@xyflow/react";

export default function RunWorkflowButton({ nodeId, selected }: { nodeId: string, selected?: boolean }) {
  const edges = useEdges();
  const { getNodes, getEdges } = useReactFlow();
  const nodeCount = useStore((s) => s.nodes.length);
  
  // root node -> no incoming edge
  const isRoot = !edges.some(e => e.target === nodeId);
  
  if (!isRoot) return null;

  const handleRun = async () => {
    const nodes = getNodes();
    const allEdges = getEdges();
    
    // console.log("Nodes:", nodes);
    // console.log("Edges:", allEdges);
    
    const inDegree: Record<string, number> = {};
    const adjList: Record<string, string[]> = {};

    nodes.forEach(node => {
      inDegree[node.id] = 0;
      adjList[node.id] = [];
    });

    allEdges.forEach(edge => {
      if (!adjList[edge.source]) adjList[edge.source] = [];
      adjList[edge.source].push(edge.target);
      
      if (inDegree[edge.target] === undefined) inDegree[edge.target] = 0;
      inDegree[edge.target]++;
    });

    const queue: string[] = [];
    Object.keys(inDegree).forEach(id => {
      if (inDegree[id] === 0) {
        queue.push(id);
      }
    });

    const executionOrder: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      executionOrder.push(current);

      const neighbors = adjList[current] || [];
      for (const neighbor of neighbors) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (executionOrder.length !== nodes.length) {
      console.error("Error: The graph contains a cycle");
      return;
    }

    const orderedNodes = executionOrder.map(id => nodes.find(n => n.id === id));
    console.log("Execution Order:", orderedNodes);

    // Send the data to our backend endpoint
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startNodeId: nodeId,
          orderedNodes: orderedNodes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run workflow');
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
      className={`absolute right-[calc(100%+16px)] top-[10px] flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 shadow-lg z-50 whitespace-nowrap ${selected ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <Play className="w-3.5 h-3.5 fill-white" />
      {nodeCount === 1 || getNodes().find(n => n.id === nodeId)?.type === "llm" ? "Run node" : "Run workflow"}
    </button>
  );
}
