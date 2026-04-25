import { Handle, Position, useReactFlow, useEdges, useNodes } from "@xyflow/react";
import { Image as ImageIcon, Upload, FileImage } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import RunWorkflowButton from "./RunWorkflowButton";
import OutputModal from "./OutputModal";
import { useRunStore } from "@/store/runStore";

export default function UploadImageNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const runningNodeIds = useRunStore((s) => s.runningNodeIds);
  const isRunning = runningNodeIds.has(id);

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

      <div className={`bg-[#1c1c1c] w-[260px] rounded-2xl shadow-xl overflow-hidden border border-[#262626] flex flex-col transition-all ${selected ? 'ring-2 ring-[#3b82f6]' : ''} ${isRunning ? 'node-running' : ''}`}>
        
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

          {isConnected && (connectedOutput as string)?.startsWith("data:image") ? (
            <img src={connectedOutput as string} alt="Connected" className="max-w-full max-h-full object-contain" />
          ) : (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors z-0"
            >
              {data.fileName ? (
                <>
                  <FileImage size={24} strokeWidth={2} className="text-[#3b82f6]" />
                  <span className="text-[13px] font-medium text-zinc-300 max-w-[200px] truncate px-4">{data.fileName}</span>
                </>
              ) : isConnected ? (
                <>
                  <ImageIcon size={24} strokeWidth={2} className="text-[#3b82f6]" />
                  <span className="text-[13px] font-medium text-[#3b82f6]">Connected</span>
                </>
              ) : (
                <>
                  <Upload size={24} strokeWidth={2} />
                  <span className="text-[13px] font-medium">Upload Image</span>
                </>
              )}
            </button>
          )}

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
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Output <span className="text-zinc-600 font-normal">(click to expand)</span></div>
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
