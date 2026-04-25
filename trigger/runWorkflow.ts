import { logger, task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ffmpegLib from "fluent-ffmpeg";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import os from "os";

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
      if (node.type === "video") {
        continue;
      }

      if (node.type === "image") {
        const incomingEdges = edges.filter((e: any) => e.target === node.id);
        if (incomingEdges.length > 0) {
          for (const edge of incomingEdges) {
            const sourceNode = orderedNodes.find((n: any) => n.id === edge.source);
            if (sourceNode && sourceNode.data.output) {
              node.data.output = sourceNode.data.output;
            }
          }
        }
        continue;
      }

      if (node.type === "text") {
        const incomingEdges = edges.filter((e: any) => e.target === node.id);
        if (incomingEdges.length > 0) {
          for (const edge of incomingEdges) {
            const sourceNode = orderedNodes.find((n: any) => n.id === edge.source);
            if (sourceNode && sourceNode.data.output) {
              node.data.text = sourceNode.data.output;
            }
          }
        }
        node.data.output = node.data.text || "";
        continue;
      }

      if (node.type === "crop") {
        const incomingEdges = edges.filter((e: any) => e.target === node.id);
        let imageUrl = "";

        for (const edge of incomingEdges) {
          const sourceNode = orderedNodes.find((n: any) => n.id === edge.source);
          if (sourceNode) {
            imageUrl = sourceNode.data.output || sourceNode.data.file || "";
          }
        }

        if (!imageUrl) {
          node.data.output = "Error: No image input connected";
          continue;
        }

        try {
          const imgRes = await fetch(imageUrl);
          const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
          const metadata = await sharp(imgBuffer).metadata();

          const imgWidth = metadata.width || 100;
          const imgHeight = metadata.height || 100;

          const cropX = Math.round(((node.data.x || 0) / 100) * imgWidth);
          const cropY = Math.round(((node.data.y || 0) / 100) * imgHeight);
          const cropW = Math.round(((node.data.w || 100) / 100) * imgWidth);
          const cropH = Math.round(((node.data.h || 100) / 100) * imgHeight);

          const clampedW = Math.min(cropW, imgWidth - cropX);
          const clampedH = Math.min(cropH, imgHeight - cropY);

          if (clampedW <= 0 || clampedH <= 0) {
            node.data.output = "Error: Invalid crop dimensions";
            continue;
          }

          const croppedBuffer = await sharp(imgBuffer)
            .extract({ left: cropX, top: cropY, width: clampedW, height: clampedH })
            .png()
            .toBuffer();

          const base64 = croppedBuffer.toString("base64");
          node.data.output = `data:image/png;base64,${base64}`;

          logger.info(`Crop Node ${node.id} completed`, { cropX, cropY, clampedW, clampedH });
        } catch (error: any) {
          logger.error(`Crop Node ${node.id} failed`, { error: error.message });
          node.data.output = `Error: ${error.message}`;
        }
        continue;
      }

      if (node.type === "frame") {
        const incomingEdges = edges.filter((e: any) => e.target === node.id);
        let videoUrl = "";

        for (const edge of incomingEdges) {
          const sourceNode = orderedNodes.find((n: any) => n.id === edge.source);
          if (sourceNode && edge.targetHandle === "url") {
            videoUrl = sourceNode.data.output || sourceNode.data.videoUrl || "";
          }
        }

        videoUrl = videoUrl || node.data.videoUrl || "";

        if (!videoUrl) {
          node.data.output = "Error: No video URL provided";
          continue;
        }

        const timestamp = node.data.timestamp || 0;

        try {
          const tmpDir = os.tmpdir();
          const inputPath = path.join(tmpDir, `input_${node.id}_${Date.now()}.mp4`);
          const outputPath = path.join(tmpDir, `frame_${node.id}_${Date.now()}.png`);

          const videoRes = await fetch(videoUrl);
          const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
          fs.writeFileSync(inputPath, videoBuffer);

          await new Promise<void>((resolve, reject) => {
            ffmpegLib(inputPath)
              .seekInput(timestamp)
              .frames(1)
              .output(outputPath)
              .on("end", () => resolve())
              .on("error", (err: Error) => reject(err))
              .run();
          });

          const frameBuffer = fs.readFileSync(outputPath);
          const base64 = frameBuffer.toString("base64");
          node.data.output = `data:image/png;base64,${base64}`;

          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);

          logger.info(`Extract Frame Node ${node.id} completed`, { timestamp });
        } catch (error: any) {
          logger.error(`Extract Frame Node ${node.id} failed`, { error: error.message });
          node.data.output = `Error: ${error.message}`;
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
          const modelId = node.data.model || "gemini-2.5-flash";
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ 
            model: modelId,
            ...(systemText ? { systemInstruction: systemText } : {})
          });

          const parts: any[] = [{ text: promptText }];

          if (imageUrl) {
            try {
              let base64: string;
              let contentType: string;

              if (imageUrl.startsWith("data:")) {
                const match = imageUrl.match(/^data:(.*?);base64,(.*)$/);
                contentType = match?.[1] || "image/png";
                base64 = match?.[2] || "";
              } else {
                const imgRes = await fetch(imageUrl);
                const imgBuffer = await imgRes.arrayBuffer();
                base64 = Buffer.from(imgBuffer).toString("base64");
                contentType = imgRes.headers.get("content-type") || "image/png";
              }

              parts.push({
                inlineData: {
                  mimeType: contentType,
                  data: base64
                }
              });
            } catch (imgErr) {
              logger.warn("Failed to fetch image for LLM", { imageUrl: imageUrl.substring(0, 100), error: imgErr });
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
