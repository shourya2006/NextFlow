import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Frame, Image as ImageIcon } from "lucide-react";
import RunWorkflowButton from "./RunWorkflowButton";

export default function ExtractFrameNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const { setNodes } = useReactFlow();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodes((nds) => 
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, videoUrl: e.target.value } } : n))
    );
  };

  const handleTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodes((nds) => 
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, timestamp: parseFloat(e.target.value) || 0 } } : n))
    );
  };

  return (
    <div className="relative font-sans mt-8 group">
      <RunWorkflowButton nodeId={id} selected={selected} />
      
      <div className="absolute -top-7 left-1 flex items-center gap-2">
        <div className="text-[#6366f1]">
          <Frame size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-medium text-zinc-400">Extract Frame</span>
      </div>

      <div className={`bg-[#1c1c1c] w-[260px] rounded-2xl shadow-xl overflow-hidden border border-[#262626] flex flex-col transition-all ${selected ? 'ring-2 ring-[#6366f1]' : ''}`}>

        <div className="w-full aspect-square bg-[#121212] flex items-center justify-center">
          <span className="text-zinc-500 text-[13px]">Results will appear here</span>
        </div>

        <div className="px-4 py-2 flex justify-end items-center relative bg-[#181818] border-y border-[#262626]">
          <span className="text-zinc-400 text-[13px] font-medium mr-1">Image</span>
          <Handle
            type="source"
            position={Position.Right}
            className="w-4 h-4 bg-[#3b82f6] border-4 border-[#1c1c1c] rounded-full right-[-8px] top-1/2 transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />
        </div>

        <div className="py-3 flex flex-col gap-2">

          <div className="px-4 py-2 relative flex flex-col gap-1.5">
            
            <Handle
              type="target"
              id="url"
              position={Position.Left}
              className="w-4 h-4 bg-[#6366f1] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-[24px] transform-none z-10"
              style={{ transform: "translateY(-50%)" }}
            />
            <span className="text-zinc-400 text-[12px] font-medium">Video URL</span>
            <input 
              type="text" 
              value={data.videoUrl || ""}
              onChange={handleUrlChange}
              placeholder="https://..." 
              className="w-full bg-[#121212] text-zinc-200 text-[13px] rounded-lg px-3 py-2 outline-none border border-[#262626] focus:border-[#6366f1] transition-colors"
            />
          </div>

          <div className="px-4 pb-2 relative flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between bg-[#121212] border border-[#262626] rounded-lg px-3 py-2 focus-within:border-[#6366f1] transition-colors">
              <span className="text-zinc-500 text-[12px] font-bold">Timestamp</span>
              <div className="flex items-center">
                <input 
                  type="number" 
                  value={data.timestamp ?? 0} 
                  onChange={handleTimestampChange}
                  step="0.1"
                  className="w-12 bg-transparent text-zinc-300 text-[13px] text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 [-moz-appearance:textfield]" 
                />
                <span className="text-zinc-600 text-[13px] ml-1">s</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
