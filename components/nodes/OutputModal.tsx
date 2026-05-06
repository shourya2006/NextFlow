"use client";

import { X, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useThemeStore } from "@/store/themeStore";

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
  const theme = useThemeStore((s) => s.theme);
  const d = theme === "dark";

  const isImage = output.startsWith("data:image");

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
        className={`rounded-2xl shadow-2xl flex flex-col border ${d ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-zinc-300'}`}
        style={{ width: isImage ? "auto" : "560px", height: isImage ? "auto" : "420px", maxWidth: "90vw", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-3 border-b shrink-0 ${d ? 'border-[#2a2a2a]' : 'border-zinc-200'}`}>
          <span className={`text-[13px] font-bold uppercase tracking-wider ${d ? 'text-zinc-400' : 'text-zinc-500'}`}>{title}</span>
          <div className="flex items-center gap-2">
            {!isImage && (
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 transition-colors text-[12px] px-2.5 py-1.5 rounded-lg ${d ? 'text-zinc-500 hover:text-zinc-300 bg-[#262626] hover:bg-[#333]' : 'text-zinc-500 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200'}`}
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
            <button
              onClick={onClose}
              className={`transition-colors p-1.5 rounded-lg ${d ? 'text-zinc-500 hover:text-zinc-300 hover:bg-[#262626]' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200'}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          {isImage ? (
            <img src={output} alt="Output" className="max-w-full max-h-[60vh] rounded-lg mx-auto" />
          ) : (
            <div className={`text-[14px] leading-relaxed whitespace-pre-wrap break-words ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {output}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
