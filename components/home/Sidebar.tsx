import Link from "next/link";
import { PanelLeft, Search, Ellipsis, ChevronUp, LogIn } from "lucide-react";

const MAIN_LINKS = [
  { name: "Home", href: "/app", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-HomeIcon-png-128.webp", active: false },
  { name: "Train Lora", href: "/train", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-Train-png-128.webp", active: false },
  { name: "Node Editor", href: "/nodes", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-NodeEditor-png-128.webp", active: true },
  { name: "Assets", href: "/assets", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-Assets-png-128.webp", active: false },
];

const TOOLS_LINKS = [
  { name: "Image", href: "/image", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-imageV4-png-128.webp" },
  { name: "Video", href: "/video", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-videoV2-png-128.webp" },
  { name: "Enhancer", href: "/enhancer", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-Enhance-png-128.webp" },
  { name: "Nano Banana", href: "/nano-banana", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-NanoBanana-png-128.webp" },
  { name: "Realtime", href: "/realtime", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-realtimeV2-png-128.webp" },
  { name: "Edit", href: "/edit", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-Edit-png-128.webp" },
];

export default function Sidebar({ isCollapsed, toggleCollapse }: { isCollapsed: boolean, toggleCollapse: () => void }) {
  return (
    <div className={`h-screen bg-[#000000] border-r border-[#262626] flex flex-col text-sm fixed left-0 top-0 text-zinc-300 transition-all duration-300 ${isCollapsed ? 'w-[56px]' : 'w-[260px]'}`}>
      
      {/* Header Container */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start lg:pl-[14px]'} pb-2`}>
        <button onClick={toggleCollapse} className="text-zinc-500 hover:text-zinc-300 hover:bg-[#1f1f1f] p-1.5 rounded-md transition-colors outline-none focus:ring-1 focus:ring-zinc-700">
          <PanelLeft size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hidden-scrollbar flex flex-col gap-6 pt-2 pb-2">
        {/* Main Links */}
        <div className={`flex flex-col gap-[2px] ${isCollapsed ? 'px-2 items-center' : 'px-3'}`}>
          {MAIN_LINKS.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              title={isCollapsed ? link.name : undefined}
              className={`flex items-center rounded-md transition-colors ${isCollapsed ? 'justify-center p-2 w-9 h-9' : 'gap-3 px-3 py-2'} ${link.active ? 'bg-[#2a2a2a] text-white shadow-none border border-transparent' : 'hover:bg-[#1a1a1a] hover:text-zinc-100 hover:border-transparent border border-transparent'}`}
            >
              <img src={link.icon} alt={link.name} className="w-[18px] h-[18px] object-contain shrink-0" />
              {!isCollapsed && <span>{link.name}</span>}
            </Link>
          ))}
        </div>

        {/* Tools */}
        <div className={`flex flex-col gap-[2px] ${isCollapsed ? 'px-2 items-center' : 'px-3'}`}>
          {!isCollapsed && (
             <div className="flex items-center justify-between px-3 py-1.5 mb-1 group cursor-pointer text-zinc-500 hover:text-zinc-300">
               <span className="text-[11px] font-medium uppercase tracking-wider">Tools</span>
               <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a2a2a] rounded-sm transition-opacity">
                 <Search size={14} strokeWidth={2.5} />
               </button>
             </div>
          )}
          {TOOLS_LINKS.map((tool) => (
            <Link 
              key={tool.name} 
              href={tool.href}
              title={isCollapsed ? tool.name : undefined}
              className={`flex items-center rounded-md transition-colors hover:bg-[#1a1a1a] hover:text-zinc-100 group ${isCollapsed ? 'justify-center p-2 w-9 h-9' : 'justify-between px-3 py-2'}`}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <img src={tool.icon} alt={tool.name} className="w-[18px] h-[18px] object-contain shrink-0" />
                {!isCollapsed && <span>{tool.name}</span>}
              </div>
              {!isCollapsed && (
                 <button className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-opacity">
                   <Ellipsis size={16} />
                 </button>
              )}
            </Link>
          ))}
          <div className={`flex items-center rounded-md cursor-pointer transition-colors hover:bg-[#1a1a1a] hover:text-zinc-100 text-zinc-500 ${isCollapsed ? 'justify-center p-2 mt-1 w-9 h-9' : 'gap-3 px-3 py-2 mt-1'} outline-none`}>
             <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
               <Ellipsis size={18} />
             </div>
             {!isCollapsed && <span>More</span>}
          </div>
        </div>

        {/* Sessions */}
        {!isCollapsed && (
          <div className="px-3 flex flex-col gap-0.5">
            <div className="flex items-center justify-between px-3 py-1.5 mb-1 group cursor-pointer text-zinc-500 hover:text-zinc-300">
              <span className="text-[11px] font-medium uppercase tracking-wider">Sessions</span>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a2a2a] rounded-sm transition-opacity">
                <Search size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Sign In Footer */}
      <div className={`mb-4 mt-2 flex px-3 ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <button 
          className={`flex items-center justify-center bg-[#2563eb] hover:bg-[#3b82f6] text-white font-medium transition-colors shadow-sm ${
            isCollapsed ? 'w-full h-8 rounded-sm' : 'w-full h-12 rounded-xl text-[14px]'
          }`}
        >
          {isCollapsed ? <LogIn size={18} strokeWidth={2.5} /> : 'Sign in'}
        </button>
      </div>
      <style>{`
        .hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hidden-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
