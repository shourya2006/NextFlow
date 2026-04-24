import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Image as ImageIcon, Upload, FileImage } from "lucide-react";
import { useRef, useState } from "react";
import RunWorkflowButton from "./RunWorkflowButton";
import OutputModal from "./OutputModal";

export default function UploadImageNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const { setNodes } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);

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
        <div className="text-[#3b82f6]">
          <ImageIcon size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-medium text-zinc-400">Image</span>
      </div>

      <div className={`bg-[#1c1c1c] w-[260px] rounded-2xl shadow-xl overflow-hidden border border-[#262626] flex flex-col transition-all ${selected ? 'ring-2 ring-[#3b82f6]' : ''}`}>
        
        <div className="h-[120px] relative flex items-center justify-center border-b border-[#262626]">
          <Handle
            type="target"
            position={Position.Left}
            className="w-4 h-4 bg-[#3b82f6] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-1/2 transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors z-0"
          >
            {data.fileName ? (
              <>
                <FileImage size={24} strokeWidth={2} className="text-[#3b82f6]" />
                <span className="text-[13px] font-medium text-zinc-300 max-w-[200px] truncate px-4">{data.fileName}</span>
              </>
            ) : (
              <>
                <Upload size={24} strokeWidth={2} />
                <span className="text-[13px] font-medium">Upload Image</span>
              </>
            )}
          </button>

          <Handle
            type="source"
            position={Position.Right}
            className="w-4 h-4 bg-[#3b82f6] border-4 border-[#1c1c1c] rounded-full right-[-8px] top-1/2 transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />
        </div>

        {data.output && (
          <div 
            className="p-3 bg-[#161616] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
            onClick={() => setShowModal(true)}
          >
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Output URL <span className="text-zinc-600 font-normal">(click to expand)</span></div>
            <div className="text-[#3b82f6] text-[12px] truncate">{data.output}</div>
          </div>
        )}

        {showModal && (
          <OutputModal output={data.output} onClose={() => setShowModal(false)} title="Image URL" />
        )}
      </div>
    </div>
  );
}
