import { logger, task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const orderedNodes = executionOrder.map(id => nodes.find((n: any) => n.id === id));
    
    logger.info("Graph sorted. Beginning execution...", { executionOrder });

    for (const node of orderedNodes) {
      if (node.type === "image" || node.type === "video") {
        continue;
      }

      if (node.type === "text") {
        if (!node.data.output) {
          node.data.output = node.data.text || "";
        }
        continue;
      }

      if (node.type === "llm") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          logger.error("Missing GEMINI_API_KEY");
          node.data.output = "Error: Missing GEMINI_API_KEY";
          continue;
        }

        const incomingEdges = edges.filter((e: any) => e.target === node.id);
        
        let promptText = node.data.prompt || "";
        let systemText = node.data.systemPrompt || "";
        let imageUrl = "";

        for (const edge of incomingEdges) {
          const sourceNode = orderedNodes.find((n: any) => n.id === edge.source);
          if (!sourceNode) continue;

          const sourceOutput = sourceNode.data.output || sourceNode.data.text || "";

          if (edge.targetHandle === "prompt") {
            promptText = sourceOutput;
          } else if (edge.targetHandle === "system") {
            systemText = sourceOutput;
          } else if (edge.targetHandle === "image") {
            imageUrl = sourceOutput;
          }
        }

        if (!promptText) {
          node.data.output = "Error: No user message provided";
          continue;
        }

        try {
          const modelId = node.data.model || "gemini-2.0-flash";
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ 
            model: modelId,
            ...(systemText ? { systemInstruction: systemText } : {})
          });

          const parts: any[] = [{ text: promptText }];

          if (imageUrl) {
            try {
              const imgRes = await fetch(imageUrl);
              const imgBuffer = await imgRes.arrayBuffer();
              const base64 = Buffer.from(imgBuffer).toString("base64");
              const contentType = imgRes.headers.get("content-type") || "image/png";
              parts.push({
                inlineData: {
                  mimeType: contentType,
                  data: base64
                }
              });
            } catch (imgErr) {
              logger.warn("Failed to fetch image for LLM", { imageUrl, error: imgErr });
            }
          }

          const result = await model.generateContent(parts);
          const response = result.response;
          node.data.output = response.text();
          
          logger.info(`LLM Node ${node.id} completed`, { model: modelId });
        } catch (error: any) {
          logger.error(`LLM Node ${node.id} failed`, { error: error.message });
          node.data.output = `Error: ${error.message}`;
        }
      }
    }
    
    logger.info("Workflow Execution Complete");
    
    return { success: true, executionOrder: orderedNodes };
  },
});
