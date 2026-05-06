import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Video, Upload } from "lucide-react";
import { useRef, useState } from "react";
import RunWorkflowButton from "./RunWorkflowButton";
import OutputModal from "./OutputModal";
import { useRunStore } from "@/store/runStore";

export default function UploadVideoNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const { setNodes } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const currentNodeId = useRunStore((s) => s.currentNodeId);
  const isRunning = currentNodeId === id;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setNodes((nds) => 
          nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, file: base64String, fileName: file.name } } : n))
        );
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative font-sans mt-8 group">
      <RunWorkflowButton nodeId={id} selected={selected} />
      
      <div className="absolute -top-7 left-1 flex items-center gap-2">
        <div className="text-[#a855f7]">
          <Video size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-medium text-zinc-400">Video</span>
      </div>

      <div className={`bg-[#1c1c1c] w-[260px] rounded-2xl shadow-xl overflow-hidden border border-[#262626] flex flex-col transition-all ${selected ? 'ring-2 ring-[#a855f7]' : ''} ${isRunning ? 'node-running' : ''}`}>
        
        <div className="min-h-[120px] relative flex items-center justify-center border-b border-[#262626]">
          <Handle
            type="target"
            position={Position.Left}
            className="w-4 h-4 bg-[#a855f7] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-1/2 transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="video/*" 
            className="hidden" 
          />

          {data.file ? (
            <div className="relative w-full group/preview">
              <video 
                src={data.file} 
                controls 
                className="w-full max-h-[200px] object-contain bg-black"
                style={{ display: 'block' }}
              />
              <div 
                className="absolute top-2 right-2 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 cursor-pointer bg-black/60 hover:bg-black/80 rounded-lg px-2 py-1 flex items-center gap-1 z-20"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} strokeWidth={2} className="text-white" />
                <span className="text-[11px] font-medium text-white">Replace</span>
              </div>
              <div className="absolute bottom-1 left-1 right-1 px-2 py-1 bg-black/60 rounded-md pointer-events-none">
                <span className="text-[11px] font-medium text-zinc-300 truncate block">{data.fileName}</span>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors z-0 h-[120px] justify-center"
            >
              <Upload size={24} strokeWidth={2} />
              <span className="text-[13px] font-medium">Upload Video</span>
            </button>
          )}

          <Handle
            type="source"
            position={Position.Right}
            className="w-4 h-4 bg-[#a855f7] border-4 border-[#1c1c1c] rounded-full right-[-8px] top-1/2 transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />
        </div>

        {data.output && (
          <div 
            className="p-3 bg-[#161616] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
            onClick={() => setShowModal(true)}
          >
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Output URL <span className="text-zinc-600 font-normal">(click to expand)</span></div>
            <div className="text-[#a855f7] text-[12px] truncate">{data.output}</div>
          </div>
        )}

        {showModal && (
          <OutputModal output={data.output} onClose={() => setShowModal(false)} title="Video URL" />
        )}
      </div>
    </div>
  );
}
