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
  const [isRunning, setIsRunningLocal] = useState(false);
  const { setRunningIds, setCurrentNodeId, clearRunning } = useRunStore();
  const { addRun, updateRun, addNodeRun, updateNodeRun, currentWorkflowId } = useHistoryStore();

  const isRoot = !edges.some((e) => e.target === nodeId);

  if (!isRoot) return null;

  const handleRun = async () => {
    if (isRunning) return;
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
        // Phase 1: Client-side pre-processing (image/video uploads) — node by node
        for (let i = 0; i < currentNodes.length; i++) {
          const n = currentNodes[i];
          
          if (n.type === "text" && !edges.some(e => e.target === n.id)) {
            setCurrentNodeId(n.id);
            const startedAt = await trackNodeStart(n);
            currentNodes[i] = { ...n, data: { ...n.data, output: n.data.text } };
            graphChanged = true;
            await trackNodeEnd(n.id, startedAt, "success", n.data.text as string | undefined);
            setCurrentNodeId(null);
          }
          
          if (n.type === "image" && n.data.file && !n.data.output) {
            if (!transloaditKey) continue;
            setCurrentNodeId(n.id);
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
                setCurrentNodeId(null);
                continue;
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
            setCurrentNodeId(null);
          }

          if (n.type === "video" && n.data.file && !n.data.output) {
            if (!transloaditKey) continue;
            setCurrentNodeId(n.id);
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
                setCurrentNodeId(null);
                continue;
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
            setCurrentNodeId(null);
          }
        }
        
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
      const firstServerNode = currentNodes.find(n => n.type !== "text" || edges.some(e => e.target === n.id));
      if (firstServerNode) {
        setCurrentNodeId(firstServerNode.id);
      }

      try {
        const response = await fetch("/api/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startNodeId: nodeId,
            nodes: currentNodes,
            edges: componentEdges,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to run workflow");
        }

        const result = await response.json();
        
        if (result.success && result.result?.executionOrder) {
          const executedNodes = result.result.executionOrder;
          
          // Phase 3: Animate through execution order one node at a time
          for (const en of executedNodes) {
            setCurrentNodeId(en.id);
            
            // Check if node is already tracked (e.g. text/image root)
            let existingNodeRun = null;
            useHistoryStore.getState().runs.forEach(r => {
              if (r.id === runId) existingNodeRun = r.nodeRuns.find(nr => nr.nodeId === en.id);
            });

            let startedAt = Date.now();
            if (!existingNodeRun) {
              startedAt = await trackNodeStart(en);
            } else {
              // It's already tracked from phase 1, skip adding it again unless it needs an update
            }
            
            setNodes((prev) => 
              prev.map(node => {
                return node.id === en.id ? { ...node, data: en.data } : node;
              })
            );

            const isError = en.data?.output?.toString().startsWith("Error");
            const status = isError ? "failed" : "success";
            const outputStr = en.data?.output?.toString();

            // Only track end if we actually tracked start just now (meaning it wasn't a phase 1 node)
            // Or if we did track it in Phase 1, its status was already set to success
            if (!existingNodeRun) {
              await trackNodeEnd(en.id, startedAt, status, isError ? undefined : outputStr, isError ? outputStr : undefined);
            }

            await new Promise(resolve => setTimeout(resolve, 400));
            setCurrentNodeId(null);
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          const endedAt = Date.now();
          const status = result.success ? "completed" : "failed";
          updateRun(runId, { status, endedAt });
          fetch(`/api/runs/${runId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, endedAt }),
          }).catch(console.error);

          // Phase 4: Post-process image uploads (Transloadit) — node by node
          for (const executedNode of executedNodes) {
            if (executedNode.type === "image" && executedNode.data.output && (executedNode.data.output as string).startsWith("data:")) {
              if (!transloaditKey) continue;
              try {
                setCurrentNodeId(executedNode.id);
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
                setCurrentNodeId(null);
              } catch (e) {
                setCurrentNodeId(null);
              }
            }
          }
        }

      } catch (error: any) {
        const endedAt = Date.now();
        updateRun(runId, { status: "failed", endedAt });
        fetch(`/api/runs/${runId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "failed", endedAt }),
        }).catch(console.error);
        // Note: individual nodes that didn't start will be left untracked, which is correct for progressive tracking
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
