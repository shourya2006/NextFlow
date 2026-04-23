import { Handle, Position } from "@xyflow/react";
import { Image as ImageIcon, Upload } from "lucide-react";
import RunWorkflowButton from "./RunWorkflowButton";

export default function UploadImageNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  return (
    <div className="relative font-sans mt-8 group">
      <RunWorkflowButton nodeId={id} selected={selected} />
      
      <div className="absolute -top-7 left-1 flex items-center gap-2">
        <div className="text-[#3b82f6]">
          <ImageIcon size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-medium text-zinc-400">Image</span>
      </div>

      <div className={`bg-[#1c1c1c] w-[260px] h-[160px] rounded-2xl shadow-xl overflow-hidden border border-[#262626] flex items-center justify-center transition-all ${selected ? 'ring-2 ring-[#3b82f6]' : ''}`}>
        
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 bg-[#3b82f6] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-1/2 transform-none"
          style={{ transform: "translateY(-50%)" }}
        />

        <button className="flex flex-col items-center gap-3 text-zinc-500 hover:text-zinc-300 transition-colors">
          <Upload size={24} strokeWidth={2} />
          <span className="text-[14px] font-medium">Upload</span>
        </button>

        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 bg-[#3b82f6] border-4 border-[#1c1c1c] rounded-full right-[-8px] top-1/2 transform-none"
          style={{ transform: "translateY(-50%)" }}
        />
      </div>
    </div>
  );
}
