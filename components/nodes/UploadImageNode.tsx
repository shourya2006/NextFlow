import { Handle, Position, useReactFlow, useEdges, useNodes } from "@xyflow/react";
import { Image as ImageIcon, Upload } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import RunWorkflowButton from "./RunWorkflowButton";
import OutputModal from "./OutputModal";
import { useRunStore } from "@/store/runStore";
import { useNodeTheme } from "./nodeTheme";

export default function UploadImageNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const isRunning = useRunStore((s) => s.activeNodeIds.has(id));
  
  const t = useNodeTheme();

  const inputEdge = edges.find(e => e.target === id);
  const inputSourceNode = inputEdge ? nodes.find(n => n.id === inputEdge.source) : null;
  const isConnected = !!inputEdge;
  const connectedOutput = isConnected && inputSourceNode
    ? (inputSourceNode.data.output || "") : "";

  useEffect(() => {
    if (isConnected && connectedOutput && !data.output) {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, output: connectedOutput } } : n))
      );
    }
  }, [isConnected, connectedOutput, data.output, id, setNodes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setNodes((nds) => 
          nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, file: base64String, fileName: file.name, output: undefined } } : n))
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
        <span className={`text-[14px] font-medium ${t.label}`}>Image</span>
      </div>

      <div className={`${t.card} w-[260px] rounded-2xl shadow-xl overflow-hidden border flex flex-col transition-all ${selected ? 'ring-2 ring-[#3b82f6]' : ''} ${isRunning ? 'node-running' : ''}`}>
        
        <div className={`min-h-[120px] relative flex items-center justify-center border-b ${t.theme === 'dark' ? 'border-[#262626]' : 'border-zinc-200'}`}>
          <Handle
            type="target"
            position={Position.Left}
            className={`w-4 h-4 bg-[#3b82f6] border-4 ${t.handleBorder} rounded-full left-[-8px] top-1/2 transform-none z-10`}
            style={{ transform: "translateY(-50%)" }}
          />

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          {isConnected && (connectedOutput as string)?.startsWith("data:image") ? (
            <img src={connectedOutput as string} alt="Connected" className="w-full max-h-[200px] object-contain p-2" />
          ) : data.file ? (
            <div 
              className="relative w-full cursor-pointer group/preview"
              onClick={() => fileInputRef.current?.click()}
            >
              <img 
                src={data.file} 
                alt={data.fileName || "Preview"} 
                className="w-full max-h-[200px] object-contain p-2" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/40 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-1">
                  <Upload size={20} strokeWidth={2} className="text-white" />
                  <span className="text-[11px] font-medium text-white">Replace</span>
                </div>
              </div>
              <div className="absolute bottom-1 left-1 right-1 px-2 py-1 bg-black/60 rounded-md">
                <span className="text-[11px] font-medium text-zinc-300 truncate block">{data.fileName}</span>
              </div>
            </div>
          ) : isConnected ? (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center gap-2 ${t.action} transition-colors z-0 h-[120px] justify-center`}
            >
              <ImageIcon size={24} strokeWidth={2} className="text-[#3b82f6]" />
              <span className="text-[13px] font-medium text-[#3b82f6]">Connected</span>
            </button>
          ) : (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center gap-2 ${t.action} transition-colors z-0 h-[120px] justify-center`}
            >
              <Upload size={24} strokeWidth={2} />
              <span className="text-[13px] font-medium">Upload Image</span>
            </button>
          )}

          <Handle
            type="source"
            position={Position.Right}
            className={`w-4 h-4 bg-[#3b82f6] border-4 ${t.handleBorder} rounded-full right-[-8px] top-1/2 transform-none z-10`}
            style={{ transform: "translateY(-50%)" }}
          />
        </div>

        {data.output && (
          <div 
            className={`p-3 ${t.outputAlt} cursor-pointer transition-colors`}
            onClick={() => setShowModal(true)}
          >
            <div className={`text-[11px] font-bold ${t.textMuted} uppercase tracking-wider mb-2`}>Output <span className={`${t.labelMuted} font-normal`}>(click to expand)</span></div>
            <img src={data.output} alt="Output" className="w-full rounded-lg mb-2" />
            {!(data.output as string).startsWith("data:") && (
              <div className="text-[#3b82f6] text-[11px] truncate">{data.output}</div>
            )}
          </div>
        )}

        {showModal && (
          <OutputModal output={data.output} onClose={() => setShowModal(false)} title="Image Output" />
        )}
      </div>
    </div>
  );
}
