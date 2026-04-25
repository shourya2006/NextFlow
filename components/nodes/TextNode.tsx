import { useEffect, useState } from "react";
import { Handle, Position, useReactFlow, useEdges, useNodes } from "@xyflow/react";
import { Type, Pencil, Copy } from "lucide-react";
import RunWorkflowButton from "./RunWorkflowButton";
import OutputModal from "./OutputModal";

export default function TextNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();

  const textEdge = edges.find(e => e.target === id && e.targetHandle === "text");
  const textSourceNode = textEdge ? nodes.find(n => n.id === textEdge.source) : null;
  const isConnected = !!textEdge;
  const displayValue = isConnected && textSourceNode 
    ? (textSourceNode.data.output || textSourceNode.data.text || "") 
    : (data.text || "");

  useEffect(() => {
    if (isConnected && data.text !== displayValue) {
      setNodes((nds) => 
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: displayValue } } : n))
      );
    }
  }, [isConnected, displayValue, data.text, id, setNodes]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isConnected) return;
    setNodes((nds) => 
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: e.target.value } } : n))
    );
  };

  return (
    <div className="relative font-sans mt-8 group">
      <RunWorkflowButton nodeId={id} selected={selected} />
      
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
            id="text"
            position={Position.Left}
            className="w-4 h-4 bg-[#eab308] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-[24px] transform-none"
            style={{ transform: "translateY(-50%)" }}
          />
          <span className="text-zinc-400 text-[13px] font-medium pl-1">Input</span>

          <span className="text-zinc-400 text-[13px] font-medium pr-1">Output</span>
          
          <Handle
            type="source"
            id="text"
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
              value={displayValue}
              onChange={handleTextChange}
              disabled={isConnected}
              className={`w-full bg-[#121212] ${isConnected ? 'text-zinc-500 cursor-not-allowed' : 'text-zinc-200'} text-[14px] rounded-xl p-3 min-h-[100px] outline-none border border-transparent focus:border-[#eab308] transition-colors resize-y [&::-webkit-resizer]:hidden`}
              placeholder={isConnected ? "Value provided by connected node..." : "Write something"}
              spellCheck={false}
            />
            
            <div className="absolute bottom-2 right-2 pointer-events-none">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 4.5L5.5 5.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M1.5 4.5L5.5 0.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          
          {data.output && (
            <div 
              className="mt-3 bg-[#101010] border border-[#262626] rounded-xl p-3 cursor-pointer hover:border-[#3a3a3a] transition-colors"
              onClick={() => setShowModal(true)}
            >
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Output <span className="text-zinc-600 font-normal">(click to expand)</span></div>
              <div className="text-zinc-300 text-[13px] line-clamp-3">{data.output}</div>
            </div>
          )}

          {showModal && (
            <OutputModal output={data.output} onClose={() => setShowModal(false)} title="Text Output" />
          )}
        </div>
      </div>
    </div>
  );
}
