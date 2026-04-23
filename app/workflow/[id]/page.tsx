"use client";

import { use, useState, useCallback } from "react";
import { ReactFlow, Background, BackgroundVariant, useNodesState, useEdgesState, addEdge, type Node, type Connection } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Sidebar from "@/components/home/Sidebar";
import TextNode from "@/components/nodes/TextNode";
import UploadImageNode from "@/components/nodes/UploadImageNode";
import UploadVideoNode from "@/components/nodes/UploadVideoNode";
import LLMNode from "@/components/nodes/LLMNode";
import CropImageNode from "@/components/nodes/CropImageNode";
import ExtractFrameNode from "@/components/nodes/ExtractFrameNode";
import {
  Grip,
  Plus,
  MousePointer2,
  Hand,
  Scissors,
  SquareDashed,
  Link as LinkIcon,
} from "lucide-react";

export default function WorkflowEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeTool, setActiveTool] = useState("cursor");

  const nodeTypes = {
    textNode: TextNode,
    uploadImageNode: UploadImageNode,
    uploadVideoNode: UploadVideoNode,
    llmNode: LLMNode,
    cropImageNode: CropImageNode,
    extractFrameNode: ExtractFrameNode,
  };

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleAddNode = useCallback((nodeType: string) => {
    const randomOffset = Math.floor(Math.random() * 100);
    const isCustomTextNode = nodeType === "Text Node";
    const isCustomUploadImageNode = nodeType === "Upload Image";
    const isCustomUploadVideoNode = nodeType === "Upload Video";
    const isCustomLLMNode = nodeType === "LLM Node";
    const isCustomCropImageNode = nodeType === "Crop Image";
    const isCustomExtractFrameNode = nodeType === "Extract Frame";
    
    let type = "default";
    if (isCustomTextNode) type = "textNode";
    if (isCustomUploadImageNode) type = "uploadImageNode";
    if (isCustomUploadVideoNode) type = "uploadVideoNode";
    if (isCustomLLMNode) type = "llmNode";
    if (isCustomCropImageNode) type = "cropImageNode";
    if (isCustomExtractFrameNode) type = "extractFrameNode";

    const isCustom = isCustomTextNode || isCustomUploadImageNode || isCustomUploadVideoNode || isCustomLLMNode || isCustomCropImageNode || isCustomExtractFrameNode;

    const newNode: Node = {
      id: `${nodeType.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      type,
      position: { x: 200 + randomOffset, y: 150 + randomOffset },
      data: { label: nodeType },
      ...(isCustom ? {} : {
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #262626',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontFamily: 'inherit',
        }
      })
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="flex w-screen h-screen bg-[#0a0a0a] text-zinc-100 overflow-hidden font-sans">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onAddNode={handleAddNode}
      />

      <main
        className={`relative flex-1 flex flex-col bg-[#0a0a0a] transition-all duration-300 ${isCollapsed ? "ml-[56px]" : "ml-[260px]"}`}
      >
        <div className="absolute top-4 left-4 z-50">
          <button className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Grip className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-500 mx-0.5">&rsaquo;</span>
            Untitled
          </button>
        </div>

        {/* Center Screen TEXT */}
        {nodes.length === 0 && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center gap-1.5 opacity-40">
            <p className="text-[15px] font-medium text-zinc-300">Add a node</p>
            <p className="text-[13px] text-zinc-400">
              Double click, right click, or press{" "}
              <span className="inline-flex items-center justify-center bg-[#262626] rounded px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 ml-1">
                N
              </span>
            </p>
          </div>
        </div>}

        {/* Toolbar */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center p-1.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl shadow-xl">
          <button className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#333] transition-colors text-zinc-400 hover:text-zinc-100">
            <Plus className="w-5 h-5" strokeWidth={2} />
          </button>
          <div className="w-[1px] h-6 bg-[#333] mx-1"></div>

          <button
            onClick={() => setActiveTool("cursor")}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${activeTool === "cursor" ? "bg-[#333] text-white" : "hover:bg-[#333] text-zinc-400 hover:text-zinc-100"}`}
          >
            <MousePointer2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("hand")}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${activeTool === "hand" ? "bg-[#333] text-white" : "hover:bg-[#333] text-zinc-400 hover:text-zinc-100"}`}
          >
            <Hand className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("cut")}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${activeTool === "cut" ? "bg-[#333] text-white" : "hover:bg-[#333] text-zinc-400 hover:text-zinc-100"}`}
          >
            <Scissors className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("boxSelect")}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${activeTool === "boxSelect" ? "bg-[#333] text-white" : "hover:bg-[#333] text-zinc-400 hover:text-zinc-100"}`}
          >
            <SquareDashed className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("link")}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${activeTool === "link" ? "bg-[#333] text-white" : "hover:bg-[#333] text-zinc-400 hover:text-zinc-100"}`}
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* React Flow Canvas */}
        <div className="absolute inset-0 z-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="dark"
            proOptions={{ hideAttribution: true }}
          >
            <Background
              color="#222"
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.5}
            />
          </ReactFlow>
        </div>
      </main>
    </div>
  );
}
