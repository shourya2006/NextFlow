"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthModal from "./AuthModal";
import { UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import {
  PanelLeft,
  LogIn,
  Ellipsis,
  Frame,
  LogOut,
  X,
} from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

const MAIN_LINKS = [
  {
    name: "Home",
    href: "/",
    icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-HomeIcon-png-128.webp",
    active: false,
  },
  {
    name: "Node Editor",
    href: "/",
    icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-NodeEditor-png-128.webp",
    active: true,
  },
];

const TOOLS_LINKS = [
  {
    name: "Text Node",
    icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-realtimeV2-png-128.webp",
  },
  {
    name: "Upload Image",
    icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-imageV4-png-128.webp",
  },
  {
    name: "Upload Video",
    icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-videoV2-png-128.webp",
  },
  {
    name: "LLM Node",
    icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-NanoBanana-png-128.webp",
  },
  {
    name: "Crop Image",
    icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-Edit-png-128.webp",
  },
  { name: "Extract Frame", icon: Frame },
];

export default function Sidebar({
  isCollapsed,
  toggleCollapse,
  onAddNode,
}: {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onAddNode?: (nodeType: string) => void;
}) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const { theme } = useThemeStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <>
      {/* Header */}
      <div className={`p-4 flex items-center ${collapsed ? "justify-center" : "justify-between"} pb-2`}>
        <button
          onClick={collapsed ? toggleCollapse : toggleCollapse}
          className={`p-1.5 rounded-md transition-colors outline-none focus:ring-1 ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1f1f1f] focus:ring-zinc-700' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 focus:ring-zinc-300'}`}
        >
          <PanelLeft size={18} strokeWidth={2} />
        </button>
        {/* Close button for mobile drawer */}
        {!collapsed && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-zinc-500 hover:text-zinc-300 p-1.5 rounded-md"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto hidden-scrollbar flex flex-col gap-6 pt-2 pb-2">
        {/* Main Links */}
        <div className={`flex flex-col gap-[2px] ${collapsed ? "px-2 items-center" : "px-3"}`}>
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? link.name : undefined}
              className={`flex items-center rounded-md transition-colors ${collapsed ? "justify-center p-2 w-9 h-9" : "gap-3 px-3 py-2"} ${link.active ? (theme === 'dark' ? 'bg-[#2a2a2a] text-white' : 'bg-zinc-200 text-zinc-900') + ' shadow-none border border-transparent' : (theme === 'dark' ? 'hover:bg-[#1a1a1a] hover:text-zinc-100' : 'hover:bg-zinc-100 hover:text-zinc-800') + ' hover:border-transparent border border-transparent'}`}
            >
              <img src={link.icon} alt={link.name} className="w-[18px] h-[18px] object-contain shrink-0" />
              {!collapsed && <span>{link.name}</span>}
            </Link>
          ))}
        </div>

        {/* Tools */}
        <div className={`flex flex-col gap-[2px] ${collapsed ? "px-2 items-center" : "px-3"}`}>
          {!collapsed && (
            <div className="flex items-center justify-between px-3 py-1.5 mb-1 group cursor-pointer text-zinc-500 hover:text-zinc-300">
              <span className="text-[11px] font-medium uppercase tracking-wider">Tools</span>
            </div>
          )}
          {TOOLS_LINKS.map((tool) => {
            const IconComponent = tool.icon;
            if (onAddNode) {
              return (
                <button
                  key={tool.name}
                  onClick={() => { onAddNode(tool.name); setMobileOpen(false); }}
                  title={collapsed ? tool.name : undefined}
                  className={`flex items-center rounded-md transition-colors group outline-none ${theme === 'dark' ? 'hover:bg-[#1a1a1a] hover:text-zinc-100' : 'hover:bg-zinc-100 hover:text-zinc-800'} ${collapsed ? "justify-center p-2 w-9 h-9" : "justify-between px-3 py-2"}`}
                >
                  <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                    {typeof IconComponent === "string" ? (
                      <img src={IconComponent} alt={tool.name} className="w-[18px] h-[18px] object-contain shrink-0" />
                    ) : (
                      <IconComponent className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-100" />
                    )}
                    {!collapsed && <span>{tool.name}</span>}
                  </div>
                  {!collapsed && (
                    <div className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-opacity">
                      <Ellipsis size={16} />
                    </div>
                  )}
                </button>
              );
            }
            return (
              <div
                key={tool.name}
                title={collapsed ? tool.name : undefined}
                className={`flex items-center rounded-md transition-colors group cursor-pointer ${theme === 'dark' ? 'hover:bg-[#1a1a1a] hover:text-zinc-100' : 'hover:bg-zinc-100 hover:text-zinc-800'} ${collapsed ? "justify-center p-2 w-9 h-9" : "justify-between px-3 py-2"}`}
              >
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                  {typeof IconComponent === "string" ? (
                    <img src={IconComponent} alt={tool.name} className="w-[18px] h-[18px] object-contain shrink-0" />
                  ) : (
                    <IconComponent className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-100" />
                  )}
                  {!collapsed && <span>{tool.name}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={`mb-4 mt-auto flex px-3 ${collapsed ? "justify-center px-0" : ""}`}>
        {isLoaded ? (
          isSignedIn ? (
            <div className={`flex w-full items-center justify-between ${collapsed ? "justify-center p-0 bg-transparent border-transparent" : `px-2 py-1.5 rounded-xl border ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#262626]' : 'bg-zinc-100 border-zinc-200'}`}`}>
              <div className="flex items-center min-w-0">
                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 shrink-0" } }} />
                {!collapsed && (
                  <span className="ml-3 text-[14px] font-medium text-white truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </span>
                )}
              </div>
              {!collapsed && (
                <SignOutButton>
                  <button className={`p-1.5 transition-colors ml-1 shrink-0 rounded-md ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300 hover:bg-[#2a2a2a]' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200'}`} title="Sign Out">
                    <LogOut size={16} />
                  </button>
                </SignOutButton>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setIsAuthModalOpen(true); setMobileOpen(false); }}
              className={`flex items-center justify-center font-medium transition-colors shadow-sm ${theme === 'dark' ? 'bg-[#2563eb] hover:bg-[#3b82f6] text-white' : 'bg-[#2563eb] hover:bg-[#3b82f6] text-white'} ${collapsed ? "w-full h-8 rounded-sm" : "w-full h-12 rounded-xl text-[14px]"}`}
            >
              {collapsed ? <LogIn size={18} strokeWidth={2.5} /> : "Sign in"}
            </button>
          )
        ) : (
          <div className="w-full h-12 bg-[#1a1a1a] rounded-xl animate-pulse"></div>
        )}
      </div>
      <style>{`
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar (md+) ── */}
      <div
        className={`hidden md:flex h-screen border-r flex-col text-sm fixed left-0 top-0 transition-all duration-300 z-40 ${theme === 'dark' ? 'bg-[#000000] border-[#262626] text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600'} ${isCollapsed ? "w-[56px]" : "w-[260px]"}`}
      >
        <SidebarContent collapsed={isCollapsed} />
      </div>

      {/* ── Mobile top bar ── */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b flex items-center justify-between px-4 ${theme === 'dark' ? 'bg-[#000000] border-[#262626]' : 'bg-white border-zinc-200'}`}>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-md"
        >
          <PanelLeft size={20} />
        </button>
        <span className="text-white font-medium text-[15px]">NextFlow</span>
        <div className="w-8" />
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          {/* Backdrop — fully opaque dark overlay */}
          <div className="absolute inset-0 bg-black/80" onClick={() => setMobileOpen(false)} />
          {/* Drawer panel */}
          <div
            ref={drawerRef}
            className={`relative z-10 w-[280px] min-[360px]:w-[300px] h-full border-r flex flex-col text-sm shadow-2xl ${theme === 'dark' ? 'bg-[#000000] border-[#262626] text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600'}`}
          >
            <SidebarContent collapsed={false} />
          </div>
          {/* Tap-to-close area on the right */}
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
