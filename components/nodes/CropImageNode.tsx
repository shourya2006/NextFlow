import { useState } from "react";
import { Handle, Position, useReactFlow, useEdges, useNodes } from "@xyflow/react";
import { Crop } from "lucide-react";
import RunWorkflowButton from "./RunWorkflowButton";
import OutputModal from "./OutputModal";
import { useRunStore } from "@/store/runStore";

export default function CropImageNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();
  const [showModal, setShowModal] = useState(false);
  const runningNodeIds = useRunStore((s) => s.runningNodeIds);
  const isRunning = runningNodeIds.has(id);

  const imageEdge = edges.find(e => e.target === id);
  const imageSourceNode = imageEdge ? nodes.find(n => n.id === imageEdge.source) : null;
  const isConnected = !!imageEdge;
  const connectedImageUrl = isConnected && imageSourceNode
    ? (imageSourceNode.data.output || "") : "";

  const handleParamChange = (param: string, value: string) => {
    setNodes((ele) => 
      ele.map((n) => (n.id === id ? { ...n, data: { ...n.data, [param]: parseFloat(value) || 0 } } : n))
    );
  };

  return (
    <div className="relative font-sans mt-8 group">
      <RunWorkflowButton nodeId={id} selected={selected} />
      
      <div className="absolute -top-7 left-1 flex items-center gap-2">
        <div className="text-[#14b8a6]">
          <Crop size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-medium text-zinc-400">Crop Image</span>
      </div>

      <div className={`bg-[#1c1c1c] w-[260px] rounded-2xl shadow-xl overflow-hidden border border-[#262626] flex flex-col transition-all ${selected ? 'ring-2 ring-[#14b8a6]' : ''} ${isRunning ? 'node-running' : ''}`}>

        <div className="px-4 py-3 relative flex items-center justify-between border-b border-[#262626]">
          <Handle
            type="target"
            position={Position.Left}
            className="w-4 h-4 bg-[#14b8a6] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-1/2 transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />
          <span className="text-zinc-400 text-[13px] font-medium">Image Input</span>
          {isConnected ? (
            <span className="text-[#14b8a6] text-[11px]">Connected</span>
          ) : (
            <span className="text-zinc-600 text-[11px]">Not connected</span>
          )}
          <Handle
            type="source"
            position={Position.Right}
            className="w-4 h-4 bg-[#14b8a6] border-4 border-[#1c1c1c] rounded-full right-[-8px] top-1/2 transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />
        </div>

        {connectedImageUrl && !(connectedImageUrl as string).startsWith("data:") && (
          <div className="h-[100px] bg-[#121212] flex items-center justify-center overflow-hidden">
            <img src={connectedImageUrl as string} alt="Input" className="max-w-full max-h-full object-contain" />
          </div>
        )}

        <div className="p-3 bg-[#161616]">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "X", key: "x", def: 0 },
              { label: "Y", key: "y", def: 0 },
              { label: "W", key: "w", def: 100 },
              { label: "H", key: "h", def: 100 },
            ].map(({ label, key, def }) => (
              <div key={key} className="flex items-center justify-between bg-[#121212] border border-[#262626] rounded-lg px-2.5 py-1.5 focus-within:border-[#14b8a6] transition-colors">
                <span className="text-zinc-500 text-[11px] font-bold w-4">{label}</span>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={data[key] ?? def} 
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    className="w-10 bg-transparent text-zinc-300 text-[12px] text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 [-moz-appearance:textfield]" 
                  />
                  <span className="text-zinc-600 text-[12px] ml-1">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.output && (
          <div 
            className="p-3 bg-[#101010] border-t border-[#262626] cursor-pointer hover:bg-[#151515] transition-colors"
            onClick={() => setShowModal(true)}
          >
            {data.output.startsWith("data:image") ? (
              <>
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Cropped Output <span className="text-zinc-600 font-normal">(click to expand)</span></div>
                <img src={data.output} alt="Cropped" className="w-full rounded-lg" />
              </>
            ) : (
              <>
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Output</div>
                <div className="text-zinc-400 text-[12px] line-clamp-2">{data.output}</div>
              </>
            )}
          </div>
        )}

        {showModal && (
          <OutputModal output={data.output} onClose={() => setShowModal(false)} title="Cropped Image" />
        )}

      </div>
    </div>
  );
}
