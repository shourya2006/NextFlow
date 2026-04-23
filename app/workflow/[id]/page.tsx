"use client";

import { use, useState } from "react";
import { ReactFlow, Background, BackgroundVariant } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Sidebar from "@/components/home/Sidebar";
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

  return (
    <div className="flex w-screen h-screen bg-[#0a0a0a] text-zinc-100 overflow-hidden font-sans">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center gap-1.5 opacity-40">
            <p className="text-[15px] font-medium text-zinc-300">Add a node</p>
            <p className="text-[13px] text-zinc-400">
              Double click, right click, or press{" "}
              <span className="inline-flex items-center justify-center bg-[#262626] rounded px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 ml-1">
                N
              </span>
            </p>
          </div>
        </div>

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
            nodes={[]}
            edges={[]}
            onNodesChange={() => {}}
            onEdgesChange={() => {}}
            onConnect={() => {}}
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
