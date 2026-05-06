"use client";

import { useState } from "react";
import { Handle, Position, useReactFlow, useEdges, useNodes } from "@xyflow/react";
import { BrainCircuit, ChevronDown, Image as ImageIcon } from "lucide-react";
import RunWorkflowButton from "./RunWorkflowButton";
import OutputModal from "./OutputModal";
import { useRunStore } from "@/store/runStore";
import { useNodeTheme } from "./nodeTheme";

const MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite" },
  { id: "gemma-3-1b-it", label: "Gemma 3 1B" },
];

export default function LLMNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();
  const currentNodeId = useRunStore((s) => s.currentNodeId);
  const isRunning = currentNodeId === id;
  const t = useNodeTheme();

  const promptEdge = edges.find(e => e.target === id && e.targetHandle === "prompt");
  const promptSourceNode = promptEdge ? nodes.find(n => n.id === promptEdge.source) : null;
  const isPromptConnected = !!promptEdge;
  const promptValue = isPromptConnected && promptSourceNode 
    ? (promptSourceNode.data.output || promptSourceNode.data.text || "")
    : (data.prompt || "");

  const systemEdge = edges.find(e => e.target === id && e.targetHandle === "system");
  const systemSourceNode = systemEdge ? nodes.find(n => n.id === systemEdge.source) : null;
  const isSystemConnected = !!systemEdge;
  const systemValue = isSystemConnected && systemSourceNode
    ? (systemSourceNode.data.output || systemSourceNode.data.text || "")
    : (data.systemPrompt || "");

  const imageEdge = edges.find(e => e.target === id && e.targetHandle === "image");
  const imageSourceNode = imageEdge ? nodes.find(n => n.id === imageEdge.source) : null;
  const isImageConnected = !!imageEdge;
  const imageValue = isImageConnected && imageSourceNode
    ? (imageSourceNode.data.output || "")
    : "";

  const selectedModel = data.model || "gemini-2.0-flash";
  const selectedModelLabel = MODELS.find(m => m.id === selectedModel)?.label || "Gemini 2.0 Flash";

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isPromptConnected) return;
    setNodes((nds) => 
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, prompt: e.target.value } } : n))
    );
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isSystemConnected) return;
    setNodes((nds) => 
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, systemPrompt: e.target.value } } : n))
    );
  };

  const handleModelSelect = (modelId: string) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, model: modelId } } : n))
    );
    setIsModelOpen(false);
  };

  return (
    <div className="relative font-sans mt-8 group">
      <RunWorkflowButton nodeId={id} selected={selected} />
      
      <div className="absolute -top-7 left-1 flex items-center gap-2">
        <div className="text-[#10b981]">
          <BrainCircuit size={16} strokeWidth={2.5} />
        </div>
        <span className={`text-[14px] font-medium ${t.label}`}>LLM</span>
      </div>

      <div className={`${t.card} w-[280px] rounded-2xl shadow-xl overflow-visible border transition-all pb-4 ${selected ? 'ring-2 ring-[#10b981]' : ''} ${isRunning ? 'node-running' : ''}`}>

        <Handle
          type="source"
          position={Position.Right}
          className={`w-4 h-4 bg-[#10b981] border-4 ${t.handleBorder} rounded-full right-[-8px] top-[32px] transform-none z-10`}
          style={{ transform: "translateY(-50%)" }}
        />

        <div className="px-4 pt-4 pb-2 flex items-center justify-between relative">
          <span className={`${t.label} text-[13px] font-medium`}>Model</span>
          <div className="relative">
            <button 
              onClick={() => setIsModelOpen(!isModelOpen)}
              className={`flex items-center gap-2 ${t.input} border rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors`}
            >
              <BrainCircuit size={14} className="text-[#10b981]" />
              <span className={`${t.textPrimary} text-[13px] font-medium`}>{selectedModelLabel}</span>
              <ChevronDown size={14} className={`${t.textMuted} ml-1`} />
            </button>

            {isModelOpen && (
              <div className={`absolute top-full right-0 mt-1 w-[180px] ${t.card} border rounded-xl shadow-2xl z-50 overflow-hidden`}>
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${
                      selectedModel === model.id 
                        ? "bg-[#10b981]/10 text-[#10b981]" 
                        : `${t.textValue} ${t.theme === 'dark' ? 'hover:bg-[#262626]' : 'hover:bg-zinc-100'}`
                    }`}
                  >
                    {model.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-2 relative">
          <Handle
            type="target"
            id="prompt"
            position={Position.Left}
            className={`w-4 h-4 bg-[#eab308] border-4 ${t.handleBorder} rounded-full left-[-8px] top-[24px] transform-none z-10`}
            style={{ transform: "translateY(-50%)" }}
          />
          <span className={`${t.label} text-[13px] font-medium mb-2 block`}>User Message</span>
          <div className="relative">
            <textarea
              value={promptValue}
              onChange={handlePromptChange}
              disabled={isPromptConnected}
              className={`w-full ${t.input} ${isPromptConnected ? t.inputDisabled + ' cursor-not-allowed' : ''} text-[14px] rounded-xl p-3 min-h-[100px] outline-none border focus:border-[#10b981] transition-colors resize-y [&::-webkit-resizer]:hidden`}
              placeholder={isPromptConnected ? "Value provided by connected node..." : "Describe a sunset over the ocean..."}
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

        <div className="px-4 py-2 relative">
          <Handle
            type="target"
            id="system"
            position={Position.Left}
            className={`w-4 h-4 bg-[#ec4899] border-4 ${t.handleBorder} rounded-full left-[-8px] top-[24px] transform-none z-10`}
            style={{ transform: "translateY(-50%)" }}
          />
          <span className={`${t.label} text-[13px] font-medium mb-2 block`}>System Prompt <span className={`${t.labelMuted} text-[11px]`}>(optional)</span></span>
          <div className="relative">
            <textarea
              value={systemValue}
              onChange={handleSystemPromptChange}
              disabled={isSystemConnected}
              className={`w-full ${t.input} ${isSystemConnected ? t.inputDisabled + ' cursor-not-allowed' : ''} text-[14px] rounded-xl p-3 min-h-[60px] outline-none border focus:border-[#ec4899] transition-colors resize-y [&::-webkit-resizer]:hidden`}
              placeholder={isSystemConnected ? "Value provided by connected node..." : "You are a helpful assistant..."}
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

        <div className="px-4 py-2 relative flex items-center justify-between">
          <Handle
            type="target"
            id="image"
            position={Position.Left}
            className={`w-4 h-4 bg-[#3b82f6] border-4 ${t.handleBorder} rounded-full left-[-8px] top-1/2 transform-none z-10`}
            style={{ transform: "translateY(-50%)" }}
          />
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-[#3b82f6]" />
            <span className={`${t.label} text-[13px] font-medium`}>Images</span>
          </div>
          {isImageConnected ? (
            <span className="text-[#3b82f6] text-[12px] font-medium truncate max-w-[120px]">{(imageValue as string) || "Connected"}</span>
          ) : (
            <span className={`${t.labelMuted} text-[12px]`}>Not connected</span>
          )}
        </div>

        {data.output && (
          <div 
            className={`mx-4 mt-2 ${t.output} border rounded-xl p-3 cursor-pointer transition-colors`}
            onClick={() => setShowModal(true)}
          >
            <div className={`text-[11px] font-bold ${t.textMuted} uppercase tracking-wider mb-1`}>Output <span className={`${t.labelMuted} font-normal`}>(click to expand)</span></div>
            <div className={`${t.textValue} text-[13px] line-clamp-3`}>{data.output}</div>
          </div>
        )}

        {showModal && (
          <OutputModal output={data.output} onClose={() => setShowModal(false)} title="LLM Output" />
        )}

      </div>
    </div>
  );
}
