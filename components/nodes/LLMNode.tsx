"use client";

import { useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { BrainCircuit, ChevronDown, ChevronRight, Pencil } from "lucide-react";

export default function LLMNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodes((nds) => 
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, prompt: e.target.value } } : n))
    );
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodes((nds) => 
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, systemPrompt: e.target.value } } : n))
    );
  };

  return (
    <div className="relative font-sans mt-8">
      
      <div className="absolute -top-7 left-1 flex items-center gap-2">
        <div className="text-[#10b981]">
          <BrainCircuit size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-medium text-zinc-400">LLM</span>
      </div>

      <div className={`bg-[#1c1c1c] w-[280px] rounded-2xl shadow-xl overflow-hidden border border-[#262626] transition-all pb-4 ${selected ? 'ring-2 ring-[#10b981]' : ''}`}>

        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 bg-[#3b82f6] border-4 border-[#1c1c1c] rounded-full right-[-8px] top-[32px] transform-none z-10"
          style={{ transform: "translateY(-50%)" }}
        />

        <div className="px-4 pt-4 pb-2 flex items-center justify-between relative">
          <span className="text-zinc-400 text-[13px] font-medium">Model</span>
          <div className="flex items-center gap-2 bg-[#121212] border border-[#262626] rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-[#1a1a1a] transition-colors">
            <BrainCircuit size={14} className="text-zinc-400" />
            <span className="text-zinc-200 text-[13px] font-medium">GPT-4o</span>
            <ChevronDown size={14} className="text-zinc-500 ml-2" />
          </div>
        </div>

        <div className="px-4 py-2 relative">
          <Handle
            type="target"
            id="prompt"
            position={Position.Left}
            className="w-4 h-4 bg-[#eab308] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-[24px] transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="text-zinc-400 text-[13px] font-medium">Prompt</span>
            <Pencil size={12} className="text-zinc-500" />
          </div>
          <div className="relative">
            <textarea
              value={data.prompt || ""}
              onChange={handlePromptChange}
              className="w-full bg-[#121212] text-zinc-200 text-[14px] rounded-xl p-3 min-h-[120px] outline-none border border-transparent focus:border-[#10b981] transition-colors resize-y [&::-webkit-resizer]:hidden"
              placeholder="A beautiful sunset over a calm ocean"
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

        <div className="px-4 py-2 relative mt-2">
          
          <Handle
            type="target"
            id="settings"
            position={Position.Left}
            className="w-4 h-4 bg-zinc-500 border-4 border-[#1c1c1c] rounded-full left-[-8px] top-1/2 transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-300 transition-colors w-full"
          >
            {isSettingsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="text-[13px] font-medium">Settings</span>
          </button>
        </div>

        {isSettingsOpen && (
          <div className="mt-1 flex flex-col gap-1">
            
            <div className="px-4 py-2 flex items-center justify-between relative">
              <Handle
                type="target"
                id="image"
                position={Position.Left}
                className="w-4 h-4 bg-[#3b82f6] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-1/2 transform-none z-10"
                style={{ transform: "translateY(-50%)" }}
              />
              <span className="text-zinc-400 text-[13px] font-medium">Image</span>
              <button className="bg-[#121212] text-zinc-400 text-[12px] px-3 py-1.5 rounded-lg border border-[#262626] hover:bg-[#1a1a1a] transition-colors flex items-center gap-2">
                Add file
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              </button>
            </div>

            <div className="px-4 py-2 relative flex flex-col gap-2">
              <Handle
                type="target"
                id="system"
                position={Position.Left}
                className="w-4 h-4 bg-[#ec4899] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-[18px] transform-none z-10"
                style={{ transform: "translateY(-50%)" }}
              />
              <button 
                onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-300 transition-colors w-full"
              >
                {isSystemPromptOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-[13px] font-medium">System Prompt</span>
              </button>

              {isSystemPromptOpen && (
                <div className="relative mt-1">
                  <textarea
                    value={data.systemPrompt || ""}
                    onChange={handleSystemPromptChange}
                    className="w-full bg-[#121212] text-zinc-200 text-[14px] rounded-xl p-3 min-h-[80px] outline-none border border-transparent focus:border-[#ec4899] transition-colors resize-y [&::-webkit-resizer]:hidden"
                    placeholder="Enter system instructions..."
                    spellCheck={false}
                  />
                  
                  <div className="absolute bottom-2 right-2 pointer-events-none">
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.5 4.5L5.5 5.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M1.5 4.5L5.5 0.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
