import { useState } from "react";
import { Handle, Position, useReactFlow, useEdges, useNodes } from "@xyflow/react";
import { Frame } from "lucide-react";
import RunWorkflowButton from "./RunWorkflowButton";
import OutputModal from "./OutputModal";
import { useRunStore } from "@/store/runStore";
import { useNodeTheme } from "./nodeTheme";

export default function ExtractFrameNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();
  const [showModal, setShowModal] = useState(false);
  const isRunning = useRunStore((s) => s.activeNodeIds.has(id));
  
  const t = useNodeTheme();

  const urlEdge = edges.find(e => e.target === id && e.targetHandle === "url");
  const urlSourceNode = urlEdge ? nodes.find(n => n.id === urlEdge.source) : null;
  const isConnected = !!urlEdge;
  const connectedUrl = isConnected && urlSourceNode
    ? (urlSourceNode.data.output || "") : "";

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isConnected) return;
    setNodes((nds) => 
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, videoUrl: e.target.value } } : n))
    );
  };

  const handleTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodes((nds) => 
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, timestamp: parseFloat(e.target.value) || 0 } } : n))
    );
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodes((nds) => 
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, percentage: parseFloat(e.target.value) || 0 } } : n))
    );
  };

  return (
    <div className="relative font-sans mt-8 group">
      <RunWorkflowButton nodeId={id} selected={selected} />
      
      <div className="absolute -top-7 left-1 flex items-center gap-2">
        <div className="text-[#6366f1]">
          <Frame size={16} strokeWidth={2.5} />
        </div>
        <span className={`text-[14px] font-medium ${t.label}`}>Extract Frame</span>
      </div>

      <div className={`${t.card} w-[260px] rounded-2xl shadow-xl overflow-hidden border flex flex-col transition-all ${selected ? 'ring-2 ring-[#6366f1]' : ''} ${isRunning ? 'node-running' : ''}`}>

        <div className={`px-4 py-2 flex justify-end items-center relative ${t.header} border-b`}>
          <span className={`${t.label} text-[13px] font-medium mr-1`}>Image Output</span>
          <Handle
            type="source"
            position={Position.Right}
            className={`w-4 h-4 bg-[#3b82f6] border-4 ${t.handleBorder} rounded-full right-[-8px] top-1/2 transform-none z-10`}
            style={{ transform: "translateY(-50%)" }}
          />
        </div>

        <div className="py-3 flex flex-col gap-2">
          <div className="px-4 py-2 relative flex flex-col gap-1.5">
            <Handle
              type="target"
              id="url"
              position={Position.Left}
              className={`w-4 h-4 bg-[#6366f1] border-4 ${t.handleBorder} rounded-full left-[-8px] top-[24px] transform-none z-10`}
              style={{ transform: "translateY(-50%)" }}
            />
            <span className={`${t.label} text-[12px] font-medium`}>Video URL</span>
            <input 
              type="text" 
              value={isConnected ? (connectedUrl as string) : (data.videoUrl || "")}
              onChange={handleUrlChange}
              disabled={isConnected}
              placeholder={isConnected ? "Connected" : "https://..."} 
              className={`w-full ${t.input} ${isConnected ? t.inputDisabled + ' cursor-not-allowed' : ''} text-[13px] rounded-lg px-3 py-2 outline-none border focus:border-[#6366f1] transition-colors truncate`}
            />
          </div>

          <div className="px-4 pb-1 relative flex flex-col gap-1.5 mt-1">
            <div className={`flex items-center justify-between ${t.input} border rounded-lg px-3 py-2 focus-within:border-[#6366f1] transition-colors`}>
              <span className={`${t.labelBold} text-[12px] font-bold`}>Timestamp</span>
              <div className="flex items-center">
                <input 
                  type="number" 
                  value={data.timestamp ?? 0} 
                  onChange={handleTimestampChange}
                  step="0.1"
                  className={`w-12 bg-transparent ${t.textValue} text-[13px] text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 [-moz-appearance:textfield]`} 
                />
                <span className={`${t.labelMuted} text-[13px] ml-1`}>s</span>
              </div>
            </div>
          </div>

          <div className="px-4 pb-2 relative flex flex-col gap-1.5">
            <div className={`flex items-center justify-between ${t.input} border rounded-lg px-3 py-2 focus-within:border-[#6366f1] transition-colors`}>
              <span className={`${t.labelBold} text-[12px] font-bold`}>Percentage</span>
              <div className="flex items-center">
                <input 
                  type="number" 
                  value={data.percentage ?? 0} 
                  onChange={handlePercentageChange}
                  step="1"
                  min="0"
                  max="100"
                  className={`w-12 bg-transparent ${t.textValue} text-[13px] text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 [-moz-appearance:textfield]`} 
                />
                <span className={`${t.labelMuted} text-[13px] ml-1`}>%</span>
              </div>
            </div>
          </div>
        </div>

        {data.output && (
          <div 
            className={`p-3 ${t.output} border-t cursor-pointer transition-colors`}
            onClick={() => setShowModal(true)}
          >
            {data.output.startsWith("data:image") ? (
              <>
                <div className={`text-[11px] font-bold ${t.textMuted} uppercase tracking-wider mb-2`}>Extracted Frame <span className={`${t.labelMuted} font-normal`}>(click to expand)</span></div>
                <img src={data.output} alt="Frame" className="w-full rounded-lg" />
              </>
            ) : (
              <>
                <div className={`text-[11px] font-bold ${t.textMuted} uppercase tracking-wider mb-1`}>Output</div>
                <div className={`${t.label} text-[12px] line-clamp-2`}>{data.output}</div>
              </>
            )}
          </div>
        )}

        {showModal && (
          <OutputModal output={data.output} onClose={() => setShowModal(false)} title="Extracted Frame" />
        )}

      </div>
    </div>
  );
}
