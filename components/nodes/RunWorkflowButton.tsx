import { Play, Loader2 } from "lucide-react";
import { useState } from "react";
import { useReactFlow, useEdges, useStore } from "@xyflow/react";

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
  const [isRunning, setIsRunning] = useState(false);

  const isRoot = !edges.some((e) => e.target === nodeId);

  if (!isRoot) return null;

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const nodes = getNodes();
      const allEdges = getEdges();
      
      let currentNodes = [...nodes];
      const transloaditKey = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;
      let graphChanged = false;

      try {
        for (let i = 0; i < currentNodes.length; i++) {
          const n = currentNodes[i];
          
          if (n.type === "text" && !edges.some(e => e.target === n.id)) {
            currentNodes[i] = { ...n, data: { ...n.data, output: n.data.text } };
            graphChanged = true;
          }
          
          if (n.type === "image" && n.data.file && !n.data.output) {
            if (!transloaditKey) {
              continue;
            }

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
            }
          }

          if (n.type === "video" && n.data.file && !n.data.output) {
            if (!transloaditKey) {
              continue
            }

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
            }
          }
        }
        
        if (graphChanged) {
          setNodes(currentNodes);
        }
        
      } catch (e) {
      }

      if (nodes.length === 1 && (nodes[0].type === "text" || nodes[0].type === "image" || nodes[0].type === "video")) {
        return;
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
            edges: allEdges,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to run workflow");
        }

        const result = await response.json();
        
        if (result.success && result.result?.executionOrder) {
          const executedNodes = result.result.executionOrder;
          let updatedNodes = getNodes().map(node => {
            const executed = executedNodes.find((en: any) => en.id === node.id);
            if (executed) {
              return { ...node, data: executed.data };
            }
            return node;
          });
          setNodes(updatedNodes);

          for (let i = 0; i < updatedNodes.length; i++) {
            const n = updatedNodes[i];
            if (n.type === "image" && n.data.output && (n.data.output as string).startsWith("data:")) {
              if (!transloaditKey) continue;
              try {
                const dataUrl = n.data.output as string;
                const res = await fetch(dataUrl);
                const blob = await res.blob();

                const formData = new FormData();
                formData.append("params", JSON.stringify({
                  auth: { key: transloaditKey },
                  steps: { resize: { robot: "/image/resize" } }
                }));
                formData.append("file", blob, `image_${n.id}.png`);

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
                  updatedNodes[i] = { ...n, data: { ...n.data, output: sslUrl } };
                  setNodes([...updatedNodes]);
                }
              } catch (e) {}
            }
          }
        }

      } catch (error) {
      }
    } finally {
      setIsRunning(false);
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
