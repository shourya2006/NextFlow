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
  const { addRun, updateRun, updateNodeStatus } = useHistoryStore();

  const setRunning = (v: boolean) => {
    setIsRunningLocal(v);
    const { nodes: componentNodes, nodeIds } = getConnectedComponent(nodeId, getNodes(), getEdges());
    
    if (v) {
      setRunningIds(nodeIds);
    } else {
      clearRunning();
    }
  };

  const isRoot = !edges.some((e) => e.target === nodeId);

  if (!isRoot) return null;

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunningLocal(true);
    try {
      const allNodes = getNodes();
      const allEdges = getEdges();
      
      const { nodes: componentNodes, edges: componentEdges, nodeIds } = getConnectedComponent(nodeId, allNodes, allEdges);
      
      // Set all node IDs as part of the workflow run (for the "Running..." button state)
      setRunningIds(nodeIds);

      const runId = `run-${Date.now()}`;
      const initialNodeStatuses: Record<string, any> = {};
      nodeIds.forEach(id => {
        const node = allNodes.find(n => n.id === id);
        initialNodeStatuses[id] = { 
          status: "pending", 
          label: node?.data?.label || id 
        };
      });

      addRun({
        id: runId,
        workflowId: "current",
        startTime: Date.now(),
        status: "running",
        nodeStatuses: initialNodeStatuses
      });
      
      let currentNodes = [...componentNodes];
      const transloaditKey = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;
      let graphChanged = false;

      try {
        // Phase 1: Client-side pre-processing (image/video uploads) — node by node
        for (let i = 0; i < currentNodes.length; i++) {
          const n = currentNodes[i];
          
          if (n.type === "text" && !edges.some(e => e.target === n.id)) {
            setCurrentNodeId(n.id);
            updateNodeStatus(runId, n.id, "running");
            currentNodes[i] = { ...n, data: { ...n.data, output: n.data.text } };
            graphChanged = true;
            updateNodeStatus(runId, n.id, "success");
            setCurrentNodeId(null);
          }
          
          if (n.type === "image" && n.data.file && !n.data.output) {
            if (!transloaditKey) {
              continue;
            }

            setCurrentNodeId(n.id);
            updateNodeStatus(runId, n.id, "running");

            const res = await fetch(n.data.file as string);
            const blob = await res.blob();
            
            const formData = new FormData();
            formData.append("params", JSON.stringify({
              auth: { key: transloaditKey },
              steps: { 
                resize: { robot: "/image/resize" } 
              }
            }));
            formData.append("file", blob, (n.data.fileName as string) || "upload.png");
            
            const uploadRes = await fetch("https://api2.transloadit.com/assemblies?wait=true", {
              method: "POST",
              body: formData
            });
            
            if (!uploadRes.ok) {
              updateNodeStatus(runId, n.id, "failed", "Upload failed");
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
            
            if (!sslUrl) {
              sslUrl = uploadResult?.uploads?.[0]?.ssl_url;
            }
            
            if (!sslUrl) {
              const resultsKeys = Object.keys(uploadResult?.results || {});
              if (resultsKeys.length > 0) {
                sslUrl = uploadResult.results[resultsKeys[0]]?.[0]?.ssl_url;
              }
            }
            
            if (sslUrl) {
               currentNodes[i] = { ...n, data: { ...n.data, output: sslUrl } };
               graphChanged = true;
               updateNodeStatus(runId, n.id, "success");
            } else {
               updateNodeStatus(runId, n.id, "failed", "No URL returned");
            }
            setCurrentNodeId(null);
          }

          if (n.type === "video" && n.data.file && !n.data.output) {
            if (!transloaditKey) {
              continue
            }

            setCurrentNodeId(n.id);
            updateNodeStatus(runId, n.id, "running");

            const res = await fetch(n.data.file as string);
            const blob = await res.blob();
            
            const formData = new FormData();
            formData.append("params", JSON.stringify({
              auth: { key: transloaditKey },
              steps: { 
                encode: { robot: "/video/encode", preset: "iphone-high" } 
              }
            }));
            formData.append("file", blob, (n.data.fileName as string) || "upload.mp4");
            
            const uploadRes = await fetch("https://api2.transloadit.com/assemblies?wait=true", {
              method: "POST",
              body: formData
            });
            
            if (!uploadRes.ok) {
              updateNodeStatus(runId, n.id, "failed", "Upload failed");
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
            
            if (!sslUrl) {
              sslUrl = uploadResult?.uploads?.[0]?.ssl_url;
            }
            
            if (!sslUrl) {
              const resultsKeys = Object.keys(uploadResult?.results || {});
              if (resultsKeys.length > 0) {
                sslUrl = uploadResult.results[resultsKeys[0]]?.[0]?.ssl_url;
              }
            }
            
            if (sslUrl) {
               currentNodes[i] = { ...n, data: { ...n.data, output: sslUrl } };
               graphChanged = true;
               updateNodeStatus(runId, n.id, "success");
            } else {
               updateNodeStatus(runId, n.id, "failed", "No URL returned");
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
      }

      if (currentNodes.length === 1 && (currentNodes[0].type === "text" || currentNodes[0].type === "image" || currentNodes[0].type === "video")) {
        updateRun(runId, { status: "completed", endTime: Date.now() });
        nodeIds.forEach(id => updateNodeStatus(runId, id, "success"));
        return;
      }

      // Phase 2: Server-side execution via trigger.dev
      // Highlight the first non-processed node to indicate server work is happening
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
            
            // Update this specific node in the React Flow graph
            setNodes((prev) => 
              prev.map(node => {
                return node.id === en.id ? { ...node, data: en.data } : node;
              })
            );

            const status = en.data?.output?.toString().startsWith("Error") ? "failed" : "success";
            updateNodeStatus(runId, en.id, status, status === "failed" ? en.data.output : undefined);

            // Brief pause so the user sees each node light up sequentially
            await new Promise(resolve => setTimeout(resolve, 400));
            setCurrentNodeId(null);
            // Small gap before next node highlights
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          updateRun(runId, { 
            status: result.success ? "completed" : "failed", 
            endTime: Date.now() 
          });

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
        updateRun(runId, { status: "failed", endTime: Date.now() });
        nodeIds.forEach(id => updateNodeStatus(runId, id, "failed", error.message));
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

