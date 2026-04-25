import { Node, Edge } from "@xyflow/react";

/**
 * Finds all nodes and edges that are descendants of the given startNodeId.
 */
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

/**
 * Finds the entire weakly connected component containing the startNodeId.
 * This includes all nodes reachable by following edges in ANY direction.
 */
export function getConnectedComponent(
  startNodeId: string,
  allNodes: Node[],
  allEdges: Edge[]
) {
  const componentNodeIds = new Set<string>();
  const queue = [startNodeId];
  componentNodeIds.add(startNodeId);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    // Find ALL edges connected to this node (incoming or outgoing)
    const connectedEdges = allEdges.filter(
      (e) => e.source === currentId || e.target === currentId
    );
    
    for (const edge of connectedEdges) {
      const neighborId = edge.source === currentId ? edge.target : edge.source;
      if (!componentNodeIds.has(neighborId)) {
        componentNodeIds.add(neighborId);
        queue.push(neighborId);
      }
    }
  }

  const componentNodes = allNodes.filter((n) => componentNodeIds.has(n.id));
  const componentEdges = allEdges.filter(
    (e) => componentNodeIds.has(e.source) && componentNodeIds.has(e.target)
  );

  return {
    nodes: componentNodes,
    edges: componentEdges,
    nodeIds: Array.from(componentNodeIds),
  };
}
