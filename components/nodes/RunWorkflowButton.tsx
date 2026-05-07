import { Play, Loader2 } from "lucide-react";
import { useState } from "react";
import { useReactFlow, useEdges, useStore } from "@xyflow/react";
import { useRunStore } from "@/store/runStore";
import { useHistoryStore } from "@/store/historyStore";
import { getConnectedComponent } from "./utils";

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
  const [isRunningLocal, setIsRunningLocal] = useState(false);
  const { setRunningIds, addActiveNodeId, removeActiveNodeId, clearRunning } = useRunStore();
  const isStoreRunning = useRunStore((s) => s.runningNodeIds.has(nodeId));
  const isRunning = isRunningLocal || isStoreRunning;
  const { addRun, updateRun, addNodeRun, updateNodeRun, currentWorkflowId } = useHistoryStore();

  const isRoot = !edges.some((e) => e.target === nodeId);

  if (!isRoot) return null;

  const handleRun = async () => {
    if (isRunningLocal) return;
    setIsRunningLocal(true);
    let runId = `run-${Date.now()}`; // Fallback local ID

    try {
      const allNodes = getNodes();
      const allEdges = getEdges();
      
      const { nodes: componentNodes, edges: componentEdges, nodeIds } = getConnectedComponent(nodeId, allNodes, allEdges);
      
      // Set all node IDs as part of the workflow run (for the "Running..." button state)
      setRunningIds(nodeIds);

      // --- CREATE DB RUN ---
      if (currentWorkflowId) {
        try {
          const res = await fetch("/api/runs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workflowId: currentWorkflowId }),
          });
          if (res.ok) {
            const dbRun = await res.json();
            runId = dbRun.id;
          }
        } catch (e) {
          console.error("Failed to create DB run", e);
        }
      }

      addRun({
        id: runId,
        workflowId: currentWorkflowId || "current",
        startTime: Date.now(),
        startedAt: Date.now(), // Store new field
        status: "running",
        nodeRuns: [],
      } as any);
      
      let currentNodes = [...componentNodes];
      const transloaditKey = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;
      let graphChanged = false;

      // Helper to handle node execution tracking
      let executionOrderCounter = 0;

      const trackNodeStart = async (n: any) => {
        const startedAt = Date.now();
        const order = executionOrderCounter++;
        addNodeRun(runId, {
          nodeId: n.id,
          label: n.data?.label || n.id,
          type: n.type || "unknown",
          status: "running",
          startedAt,
          executionOrder: order,
        });

        // Async DB tracking (non-blocking)
        fetch(`/api/runs/${runId}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId: n.id,
            label: n.data?.label || n.id,
            type: n.type || "unknown",
            executionOrder: order,
          }),
        }).catch(console.error);

        return startedAt;
      };

      const trackNodeEnd = async (nId: string, startedAt: number, status: "success" | "failed", outputSummary?: string, error?: string) => {
        const endedAt = Date.now();
        const durationMs = endedAt - startedAt;
        
        // Truncate output summary if too long
        const truncatedSummary = outputSummary ? (outputSummary.length > 200 ? outputSummary.substring(0, 200) + "..." : outputSummary) : undefined;

        updateNodeRun(runId, nId, {
          status,
          endedAt,
          durationMs,
          outputSummary: truncatedSummary,
          error,
        });

        fetch(`/api/runs/${runId}/nodes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId: nId,
            status,
            endedAt,
            durationMs,
            outputSummary: truncatedSummary,
            error,
          }),
        }).catch(console.error);
      };

      try {
        // Phase 1: Client-side pre-processing (image/video uploads) — run in parallel
        const phase1Promises = currentNodes.map(async (n, i) => {
          if (n.type === "text" && !edges.some(e => e.target === n.id)) {
            addActiveNodeId(n.id);
            const startedAt = await trackNodeStart(n);
            currentNodes[i] = { ...n, data: { ...n.data, output: n.data.text } };
            graphChanged = true;
            await trackNodeEnd(n.id, startedAt, "success", n.data.text as string | undefined);
            removeActiveNodeId(n.id);
          }
          
          if (n.type === "image" && n.data.file && !n.data.output) {
            if (!transloaditKey) return;
            addActiveNodeId(n.id);
            const startedAt = await trackNodeStart(n);

            try {
              const res = await fetch(n.data.file as string);
              const blob = await res.blob();
              
              const formData = new FormData();
              formData.append("params", JSON.stringify({
                auth: { key: transloaditKey },
                steps: { resize: { robot: "/image/resize" } }
              }));
              formData.append("file", blob, (n.data.fileName as string) || "upload.png");
              
              const uploadRes = await fetch("https://api2.transloadit.com/assemblies?wait=true", {
                method: "POST",
                body: formData
              });
              
              if (!uploadRes.ok) {
                await trackNodeEnd(n.id, startedAt, "failed", undefined, "Upload failed");
                removeActiveNodeId(n.id);
                return;
              }
              let uploadResult = await uploadRes.json();

              if (uploadResult.ok === "ASSEMBLY_EXECUTING" && uploadResult.assembly_ssl_url) {
                let attempts = 0;
                while (uploadResult.ok === "ASSEMBLY_EXECUTING" && attempts < 20) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const pollRes = await fetch(uploadResult.assembly_ssl_url);
                  uploadResult = await pollRes.json();
                  attempts++;
                }
              }
              
              let sslUrl = uploadResult?.results?.resize?.[0]?.ssl_url;
              if (!sslUrl) sslUrl = uploadResult?.uploads?.[0]?.ssl_url;
              if (!sslUrl) {
                const resultsKeys = Object.keys(uploadResult?.results || {});
                if (resultsKeys.length > 0) sslUrl = uploadResult.results[resultsKeys[0]]?.[0]?.ssl_url;
              }
              
              if (sslUrl) {
                currentNodes[i] = { ...n, data: { ...n.data, output: sslUrl } };
                graphChanged = true;
                await trackNodeEnd(n.id, startedAt, "success", "Image processed successfully");
              } else {
                await trackNodeEnd(n.id, startedAt, "failed", undefined, "No URL returned");
              }
            } catch (e: any) {
              await trackNodeEnd(n.id, startedAt, "failed", undefined, e.message || "Unknown error");
            }
            removeActiveNodeId(n.id);
          }

          if (n.type === "video" && n.data.file && !n.data.output) {
            if (!transloaditKey) return;
            addActiveNodeId(n.id);
            const startedAt = await trackNodeStart(n);

            try {
              const res = await fetch(n.data.file as string);
              const blob = await res.blob();
              
              const formData = new FormData();
              formData.append("params", JSON.stringify({
                auth: { key: transloaditKey },
                steps: { encode: { robot: "/video/encode", preset: "iphone-high" } }
              }));
              formData.append("file", blob, (n.data.fileName as string) || "upload.mp4");
              
              const uploadRes = await fetch("https://api2.transloadit.com/assemblies?wait=true", {
                method: "POST",
                body: formData
              });
              
              if (!uploadRes.ok) {
                await trackNodeEnd(n.id, startedAt, "failed", undefined, "Upload failed");
                removeActiveNodeId(n.id);
                return;
              }
              let uploadResult = await uploadRes.json();

              if (uploadResult.ok === "ASSEMBLY_EXECUTING" && uploadResult.assembly_ssl_url) {
                let attempts = 0;
                while (uploadResult.ok === "ASSEMBLY_EXECUTING" && attempts < 60) {
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  const pollRes = await fetch(uploadResult.assembly_ssl_url);
                  uploadResult = await pollRes.json();
                  attempts++;
                }
              }
              
              let sslUrl = uploadResult?.results?.encode?.[0]?.ssl_url;
              if (!sslUrl) sslUrl = uploadResult?.uploads?.[0]?.ssl_url;
              if (!sslUrl) {
                const resultsKeys = Object.keys(uploadResult?.results || {});
                if (resultsKeys.length > 0) sslUrl = uploadResult.results[resultsKeys[0]]?.[0]?.ssl_url;
              }
              
              if (sslUrl) {
                currentNodes[i] = { ...n, data: { ...n.data, output: sslUrl } };
                graphChanged = true;
                await trackNodeEnd(n.id, startedAt, "success", "Video processed successfully");
              } else {
                await trackNodeEnd(n.id, startedAt, "failed", undefined, "No URL returned");
              }
            } catch (e: any) {
              await trackNodeEnd(n.id, startedAt, "failed", undefined, e.message || "Unknown error");
            }
            removeActiveNodeId(n.id);
          }
        });
        
        await Promise.all(phase1Promises);
        
        if (graphChanged) {
          setNodes((prev) => 
            prev.map(node => {
              const updated = currentNodes.find(un => un.id === node.id);
              return updated ? { ...node, data: updated.data } : node;
            })
          );
        }
        
      } catch (e) {
        console.error("Error during client preprocessing:", e);
      }

      if (currentNodes.length === 1 && (currentNodes[0].type === "text" || currentNodes[0].type === "image" || currentNodes[0].type === "video")) {
        const endedAt = Date.now();
        updateRun(runId, { status: "completed", endedAt });
        fetch(`/api/runs/${runId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed", endedAt }),
        }).catch(console.error);
        return;
      }

      // Phase 2: Server-side execution via trigger.dev
      // Poll the DB concurrently to show real-time animation + history updates
      let pollInterval: NodeJS.Timeout | null = null;
      let isPolling = true;
      
      const syncFromDb = async () => {
        try {
          const res = await fetch(`/api/runs/${runId}`);
          if (!res.ok) return;
          const runData = await res.json();
          if (!runData.nodeRuns) return;
          
          const runningIds: string[] = [];
          for (const nr of runData.nodeRuns) {
            // Update history sidebar
            const existingRun = useHistoryStore.getState().runs.find(r => r.id === runId);
            const existingNodeRun = existingRun?.nodeRuns?.find((enr: any) => enr.nodeId === nr.nodeId);
            
            if (!existingNodeRun) {
              addNodeRun(runId, {
                nodeId: nr.nodeId,
                label: nr.label,
                type: nr.type,
                status: nr.status,
                startedAt: new Date(nr.startedAt).getTime(),
                executionOrder: nr.executionOrder,
                ...(nr.endedAt ? { endedAt: new Date(nr.endedAt).getTime() } : {}),
                ...(nr.durationMs ? { durationMs: nr.durationMs } : {}),
                ...(nr.outputSummary ? { outputSummary: nr.outputSummary } : {}),
                ...(nr.error ? { error: nr.error } : {}),
              });
            } else if (existingNodeRun.status !== nr.status) {
              updateNodeRun(runId, nr.nodeId, {
                status: nr.status,
                ...(nr.endedAt ? { endedAt: new Date(nr.endedAt).getTime() } : {}),
                ...(nr.durationMs ? { durationMs: nr.durationMs } : {}),
                ...(nr.outputSummary ? { outputSummary: nr.outputSummary } : {}),
                ...(nr.error ? { error: nr.error } : {}),
              });
            }
            
            if (nr.status === "running") {
              runningIds.push(nr.nodeId);
            }
          }
          if (isPolling) {
            useRunStore.getState().setActiveNodeIds(runningIds);
          }
        } catch (e) {}
      };
      
      // Start polling immediately
      pollInterval = setInterval(syncFromDb, 600);

      try {
        // This blocks for the full execution duration (10-30s)
        const response = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId,
            startNodeId: nodeId,
            nodes: currentNodes,
            edges: componentEdges,
          }),
        });

        // Stop polling
        isPolling = false;
        if (pollInterval) clearInterval(pollInterval);
        
        // Final sync to catch last completed nodes
        await syncFromDb();
        useRunStore.getState().setActiveNodeIds([]);

        if (!response.ok) {
          throw new Error("Failed to run workflow");
        }

        const result = await response.json();
        
        if (result.success && result.result?.executionOrder) {
          const executedNodes = result.result.executionOrder;
          
          // Apply final node data to canvas
          for (const en of executedNodes) {
            setNodes((prev) => 
              prev.map(node => node.id === en.id ? { ...node, data: en.data } : node)
            );
          }

          const endedAt = Date.now();
          const status = result.success ? "completed" : "failed";
          updateRun(runId, { status, endedAt });
          fetch(`/api/runs/${runId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, endedAt }),
          }).catch(console.error);

          // Phase 4: Post-process image uploads (Transloadit) asynchronously in the background
          (async () => {
            for (const executedNode of executedNodes) {
              if (executedNode.type === "image" && executedNode.data.output && (executedNode.data.output as string).startsWith("data:")) {
                if (!transloaditKey) continue;
                try {
                  const dataUrl = executedNode.data.output as string;
                  const res = await fetch(dataUrl);
                  const blob = await res.blob();

                  const formData = new FormData();
                  formData.append("params", JSON.stringify({
                    auth: { key: transloaditKey },
                    steps: { resize: { robot: "/image/resize" } }
                  }));
                  formData.append("file", blob, `image_${executedNode.id}.png`);

                  const uploadRes = await fetch("https://api2.transloadit.com/assemblies?wait=true", {
                    method: "POST",
                    body: formData
                  });

                  let uploadResult = await uploadRes.json();
                  if (uploadResult.ok === "ASSEMBLY_EXECUTING" && uploadResult.assembly_ssl_url) {
                    let attempts = 0;
                    while (uploadResult.ok === "ASSEMBLY_EXECUTING" && attempts < 20) {
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      const pollRes = await fetch(uploadResult.assembly_ssl_url);
                      uploadResult = await pollRes.json();
                      attempts++;
                    }
                  }

                  let sslUrl = uploadResult?.results?.resize?.[0]?.ssl_url;
                  if (!sslUrl) sslUrl = uploadResult?.uploads?.[0]?.ssl_url;
                  if (!sslUrl) {
                    const keys = Object.keys(uploadResult?.results || {});
                    if (keys.length > 0) sslUrl = uploadResult.results[keys[0]]?.[0]?.ssl_url;
                  }

                  if (sslUrl) {
                    setNodes((prev) => 
                      prev.map(node => node.id === executedNode.id ? { ...node, data: { ...node.data, output: sslUrl } } : node)
                    );
                  }
                } catch (e) {
                  console.error("Transloadit post-process failed for node", executedNode.id, e);
                }
              }
            }
          })();
        }

      } catch (error: any) {
        isPolling = false;
        if (pollInterval) clearInterval(pollInterval);
        useRunStore.getState().setActiveNodeIds([]);
        const endedAt = Date.now();
        updateRun(runId, { status: "failed", endedAt });
        fetch(`/api/runs/${runId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "failed", endedAt }),
        }).catch(console.error);
      }
    } finally {
      setIsRunningLocal(false);
      clearRunning();
    }
  };

  return (
    <button
      onClick={handleRun}
      disabled={isRunning}
      className={`absolute right-[calc(100%+16px)] top-[10px] flex items-center gap-2 ${isRunning ? 'bg-[#f59e0b]' : 'bg-[#3b82f6] hover:bg-[#2563eb]'} text-white px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 shadow-lg z-50 whitespace-nowrap ${selected ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} ${isRunning ? 'cursor-not-allowed' : ''}`}
    >
      {isRunning ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Play className="w-3.5 h-3.5 fill-white" />
      )}
      {isRunning
        ? "Running..."
        : nodeCount === 1 ||
          getNodes().find((n) => n.id === nodeId)?.type === "llm"
          ? "Run node"
          : "Run workflow"}
    </button>
  );
}
