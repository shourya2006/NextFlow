import { Handle, Position } from "@xyflow/react";
import { Type, Pencil, Copy } from "lucide-react";

export default function TextNode({ data, selected }: { data: any, selected?: boolean }) {
  return (
    <div className="relative font-sans mt-8">
      
      <div className="absolute -top-7 left-1 flex items-center gap-2">
        <div className="text-[#eab308]">
          <Type size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-medium text-zinc-400">Text</span>
      </div>

      <div className={`bg-[#1c1c1c] w-[260px] rounded-2xl shadow-xl overflow-hidden border border-[#262626] transition-all ${selected ? 'ring-2 ring-[#eab308]' : ''}`}>
        
        <div className="flex items-center justify-between px-4 pt-3 pb-2 relative">
          
          <Handle
            type="target"
            position={Position.Left}
            className="w-4 h-4 bg-[#eab308] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-[24px] transform-none"
            style={{ transform: "translateY(-50%)" }}
          />
          <span className="text-zinc-400 text-[13px] font-medium pl-1">Input</span>

          <span className="text-zinc-400 text-[13px] font-medium pr-1">Output</span>
          
          <Handle
            type="source"
            position={Position.Right}
            className="w-4 h-4 bg-[#eab308] border-4 border-[#1c1c1c] rounded-full right-[-8px] top-[24px] transform-none"
            style={{ transform: "translateY(-50%)" }}
          />
        </div>

        <div className="flex items-center justify-end px-4 py-2">
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <Copy size={14} />
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="relative">
            <textarea
              className="w-full bg-[#121212] text-zinc-200 text-[14px] rounded-xl p-3 min-h-[100px] outline-none border border-transparent focus:border-[#eab308] transition-colors resize-y [&::-webkit-resizer]:hidden"
              placeholder="Write something"
              spellCheck={false}
            />
            
            <div className="absolute bottom-2 right-2 pointer-events-none">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 4.5L5.5 5.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M1.5 4.5L5.5 0.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
