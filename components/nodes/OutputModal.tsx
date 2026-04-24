"use client";

import { X, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function OutputModal({ 
  output, 
  onClose, 
  title = "Output" 
}: { 
  output: string; 
  onClose: () => void; 
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl flex flex-col"
        style={{ width: "560px", height: "420px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a] shrink-0">
          <span className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider">{title}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-[12px] bg-[#262626] hover:bg-[#333] px-2.5 py-1.5 rounded-lg"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 hover:bg-[#262626] rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <div className="text-zinc-300 text-[14px] leading-relaxed whitespace-pre-wrap break-words">
            {output}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
