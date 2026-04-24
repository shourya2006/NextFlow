import { logger, task } from "@trigger.dev/sdk/v3";

export const runWorkflow = task({
  id: "workflow-run",
  run: async (payload: any) => {
    logger.log("Workflow received", { startNodeId: payload.startNodeId });

    const nodes = payload.nodes || [];
    const edges = payload.edges || [];

    const inDegree: Record<string, number> = {};
    const adjList: Record<string, string[]> = {};

    nodes.forEach((node: any) => {
      inDegree[node.id] = 0;
      adjList[node.id] = [];
    });

    edges.forEach((edge: any) => {
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
      logger.error("Error: cycle detected");
      return { success: false, error: "Cycle detected" };
    }

    const graph = executionOrder.map(id => nodes.find((n: any) => n.id === id));
    
    logger.info("Graph:", { executionOrder });
    
    return { success: true, executionOrder };
  },
});
