import { Node, Edge } from "@xyflow/react";


export function getDescendants(
  startNodeId: string,
  allNodes: Node[],
  allEdges: Edge[]
) {
  const descendantNodeIds = new Set<string>();
  const descendantEdges: Edge[] = [];
  const queue = [startNodeId];
  descendantNodeIds.add(startNodeId);

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    const outgoingEdges = allEdges.filter((e) => e.source === currentId);
    
    for (const edge of outgoingEdges) {
      descendantEdges.push(edge);
      if (!descendantNodeIds.has(edge.target)) {
        descendantNodeIds.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  const descendantNodes = allNodes.filter((n) => descendantNodeIds.has(n.id));
  
  return {
    nodes: descendantNodes,
    edges: descendantEdges,
    nodeIds: Array.from(descendantNodeIds),
  };
}
