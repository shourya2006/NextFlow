"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Panel,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Sidebar from "@/components/home/Sidebar";
import TextNode from "@/components/nodes/TextNode";
import UploadImageNode from "@/components/nodes/UploadImageNode";
import UploadVideoNode from "@/components/nodes/UploadVideoNode";
import LLMNode from "@/components/nodes/LLMNode";
import CropImageNode from "@/components/nodes/CropImageNode";
import ExtractFrameNode from "@/components/nodes/ExtractFrameNode";
import { useSidebarStore } from "@/store/sidebarStore";
import { useHistoryStore } from "@/store/historyStore";
import WorkflowHistorySidebar from "@/components/workflow/WorkflowHistorySidebar";
import FlowingEdge from "@/components/nodes/FlowingEdge";
import RunSelectionButton from "@/components/nodes/RunSelectionButton";
import {
  Grip,
  Undo2,
  Redo2,
  Download,
  Upload,
  History,
} from "lucide-react";

type HistoryEntry = { nodes: Node[]; edges: Edge[] };

export default function WorkflowEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const { isHistoryOpen, toggleHistory } = useHistoryStore();

  const nodeTypes = {
    text: TextNode,
    image: UploadImageNode,
    video: UploadVideoNode,
    llm: LLMNode,
    crop: CropImageNode,
    frame: ExtractFrameNode,
  };

  const edgeTypes = {
    default: FlowingEdge,
  };

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [title, setTitle] = useState("Untitled");
  const [loading, setLoading] = useState(true);

  // ─── Undo / Redo history ───
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushHistory = useCallback((n: Node[], e: Edge[]) => {
    if (isUndoRedoRef.current) return;

    // Deduplicate: skip if identical to current entry
    const snapshot = JSON.stringify({ nodes: n, edges: e });
    if (historyIndexRef.current >= 0) {
      const current = historyRef.current[historyIndexRef.current];
      if (JSON.stringify({ nodes: current.nodes, edges: current.edges }) === snapshot) return;
    }

    const next = historyIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, next);
    historyRef.current.push({ nodes: structuredClone(n), edges: structuredClone(e) });
    historyIndexRef.current = next;
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const entry = historyRef.current[historyIndexRef.current];
    isUndoRedoRef.current = true;
    setNodes(entry.nodes);
    setEdges(entry.edges);
    setTimeout(() => { isUndoRedoRef.current = false; }, 200);
  }, [setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const entry = historyRef.current[historyIndexRef.current];
    isUndoRedoRef.current = true;
    setNodes(entry.nodes);
    setEdges(entry.edges);
    setTimeout(() => { isUndoRedoRef.current = false; }, 200);
  }, [setNodes, setEdges]);

  // Debounced history push on nodes/edges change
  useEffect(() => {
    if (loading || isUndoRedoRef.current) return;
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => {
      pushHistory(nodes, edges);
    }, 500);
    return () => {
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    };
  }, [nodes, edges, loading, pushHistory]);

  // Keyboard shortcuts: Ctrl/Cmd+Z for undo, Ctrl/Cmd+Shift+Z for redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

  // ─── Import / Export ───
  const handleExport = useCallback(() => {
    const data = JSON.stringify({ title, nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_").toLowerCase() || "workflow"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title, nodes, edges]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          if (json.nodes) setNodes(json.nodes);
          if (json.edges) setEdges(json.edges);
          if (json.title) setTitle(json.title);
        } catch (err) {
          console.error("Failed to import workflow", err);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [setNodes, setEdges]
  );

  // Load workflow data on mount
  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const res = await fetch(`/api/workflows/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.nodes) setNodes(data.nodes);
          if (data.edges) setEdges(data.edges);
          if (data.title) setTitle(data.title);
        }
      } catch (err) {
        console.error("Failed to load workflow", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflow();
  }, [id, setNodes, setEdges]);

  // Auto-save when nodes, edges, or title change (with basic debounce)
  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(async () => {
      try {
        await fetch(`/api/workflows/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges, title }),
        });
      } catch (e) {
        console.error("Failed to save workflow", e);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [nodes, edges, title, id, loading]);

  const handleAddNode = useCallback(
    (nodeType: string) => {
      const randomOffset = Math.floor(Math.random() * 100);
      const isCustomTextNode = nodeType === "Text Node";
      const isCustomUploadImageNode = nodeType === "Upload Image";
      const isCustomUploadVideoNode = nodeType === "Upload Video";
      const isCustomLLMNode = nodeType === "LLM Node";
      const isCustomCropImageNode = nodeType === "Crop Image";
      const isCustomExtractFrameNode = nodeType === "Extract Frame";

      let type = "default";
      if (isCustomTextNode) type = "text";
      if (isCustomUploadImageNode) type = "image";
      if (isCustomUploadVideoNode) type = "video";
      if (isCustomLLMNode) type = "llm";
      if (isCustomCropImageNode) type = "crop";
      if (isCustomExtractFrameNode) type = "frame";

      const isCustom =
        isCustomTextNode ||
        isCustomUploadImageNode ||
        isCustomUploadVideoNode ||
        isCustomLLMNode ||
        isCustomCropImageNode ||
        isCustomExtractFrameNode;

      const newNode: Node = {
        id: `${nodeType.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`,
        type,
        position: { x: 200 + randomOffset, y: 150 + randomOffset },
        data: { label: nodeType },
        ...(isCustom
          ? {}
          : {
              style: {
                background: "#1a1a1a",
                color: "#fff",
                border: "1px solid #262626",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "14px",
                fontFamily: "inherit",
              },
            }),
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      
      if (sourceNode?.type === "text") {
        const allowedTextTargets = ["prompt", "system", "text"];
        if (!allowedTextTargets.includes(connection.targetHandle || "")) {
          return false;
        }
      }
      
      // Prevent cyclic connections
      const target = connection.target;
      const source = connection.source;

      if (source === target) return false;
      
      const hasCycle = (startNode: string, targetNode: string) => {
        const queue = [startNode];
        const visited = new Set<string>();

        while (queue.length > 0) {
          const current = queue.shift()!;
          if (current === targetNode) return true;
          
          if (!visited.has(current)) {
            visited.add(current);
            const outgoingEdges = edges.filter(e => e.source === current);
            for (const edge of outgoingEdges) {
              queue.push(edge.target);
            }
          }
        }
        return false;
      };

      if (hasCycle(target, source)) {
        return false; // Connection would create a cycle
      }
      
      return true;
    },
    [nodes, edges]
  );

  return (
    <div className="flex w-screen h-screen bg-[#0a0a0a] text-zinc-100 overflow-hidden font-sans">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        onAddNode={handleAddNode}
      />

      <main
        className={`relative flex-1 flex flex-col bg-[#0a0a0a]
          pt-14 md:pt-0
          ml-0 ${isCollapsed ? "md:ml-[56px]" : "md:ml-[260px]"}
          ${isHistoryOpen ? "md:mr-80" : "mr-0"}`}
      >
        {/* Center Screen hint */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="flex flex-col items-center gap-1.5 opacity-40 px-4 text-center">
              <p className="text-[14px] sm:text-[15px] font-medium text-zinc-300">Add a node</p>
              <p className="text-[12px] sm:text-[13px] text-zinc-400">Use the sidebar menu to add nodes</p>
            </div>
          </div>
        )}

        {/* React Flow Canvas — title bar, toolbar, and RunSelectionButton all live INSIDE here */}
        <div className="absolute inset-0 z-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="dark"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#222" variant={BackgroundVariant.Dots} gap={24} size={1.5} />
            <MiniMap 
              className="hidden md:block"
              pannable
              zoomable
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #262626',
              }}
              nodeColor={(n) => {
                if (n.type === 'text') return '#eab308';
                if (n.type === 'image' || n.type === 'video' || n.type === 'crop' || n.type === 'frame') return '#3b82f6';
                if (n.type === 'llm') return '#8b5cf6';
                return '#262626';
              }}
              maskColor="rgba(0, 0, 0, 0.4)"
              maskStrokeColor="#333"
              maskStrokeWidth={2}
            />

            {/* Title bar */}
            <Panel position="top-left" style={{ margin: 0 }}>
              <div className="mt-[calc(56px+8px)] md:mt-3 ml-2 md:ml-3 flex items-center gap-2 bg-[#1a1a1a] border border-[#262626] rounded-xl px-3 py-1.5 shadow-sm max-w-[calc(100vw-80px)] md:max-w-none">
                <Grip className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-500 mx-0.5">›</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-sm font-medium placeholder-zinc-500 min-w-0"
                  style={{ width: `${Math.max(8, title.length) + 1}ch` }}
                  placeholder="Workflow title"
                />
              </div>
            </Panel>

            {/* History Toggle */}
            <Panel position="top-right" style={{ margin: 0 }}>
              {!isHistoryOpen && (
                <div className="mt-[calc(56px+8px)] md:mt-3 mr-3">
                  <button 
                    onClick={toggleHistory}
                    className="flex items-center gap-2 bg-[#1a1a1a] border border-[#262626] rounded-xl px-3 py-2 shadow-sm hover:bg-[#222] transition-colors text-zinc-400 hover:text-white"
                  >
                    <History className="w-4 h-4" />
                    <span className="text-xs font-medium">History</span>
                  </button>
                </div>
              )}
            </Panel>

            {/* Toolbar */}
            <Panel position="bottom-center" style={{ margin: 0 }}>
              <div className="mb-5 flex items-center gap-1 p-1.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl shadow-xl">
                <button onClick={handleUndo} title="Undo (⌘Z)" className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#333] transition-colors text-zinc-400 hover:text-zinc-100">
                  <Undo2 className="w-4 h-4" />
                </button>
                <button onClick={handleRedo} title="Redo (⌘⇧Z)" className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#333] transition-colors text-zinc-400 hover:text-zinc-100">
                  <Redo2 className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-6 bg-[#333] mx-0.5" />

                <button onClick={() => fileInputRef.current?.click()} title="Import workflow" className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#333] transition-colors text-zinc-400 hover:text-zinc-100">
                  <Upload className="w-4 h-4" />
                </button>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                <button onClick={handleExport} title="Export workflow" className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#333] transition-colors text-zinc-400 hover:text-zinc-100">
                  <Download className="w-4 h-4" />
                </button>

                {/* Run Selection — only visible when nodes are selected */}
                <div className="w-[1px] h-6 bg-[#333] mx-0.5" />
                <RunSelectionButton />
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </main>

      <WorkflowHistorySidebar />
    </div>
  );
}
