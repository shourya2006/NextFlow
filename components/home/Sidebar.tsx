"use client";

import Link from "next/link";
import { useState } from "react";
import AuthModal from "./AuthModal";
import { UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import {
  PanelLeft,
  LogIn,
  Ellipsis,
  Type,
  Image as ImageIcon,
  Video,
  BrainCircuit,
  Crop,
  Frame,
  LogOut,
} from "lucide-react";

const MAIN_LINKS = [
  {
    name: "Home",
    href: "/",
    icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-HomeIcon-png-128.webp",
    active: false,
  },
  {
    name: "Node Editor",
    href: "/nodes",
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

// { name: "Image", href: "/image", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-imageV4-png-128.webp" },
//   { name: "Video", href: "/video", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-videoV2-png-128.webp" },
//   { name: "Enhancer", href: "/enhancer", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-Enhance-png-128.webp" },
//   { name: "Nano Banana", href: "/nano-banana", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-NanoBanana-png-128.webp" },
//   { name: "Realtime", href: "/realtime", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-realtimeV2-png-128.webp" },
//   { name: "Edit", href: "/edit", icon: "https://optim-images.krea.ai/https---s-krea-ai-icons-Edit-png-128.webp" },

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
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <>
      <div
        className={`h-screen bg-[#000000] border-r border-[#262626] flex flex-col text-sm fixed left-0 top-0 text-zinc-300 transition-all duration-300 ${isCollapsed ? "w-[56px]" : "w-[260px]"}`}
      >
      {/* Header Container */}
      <div
        className={`p-4 flex items-center ${isCollapsed ? "justify-center" : "justify-start lg:pl-[14px]"} pb-2`}
      >
        <button
          onClick={toggleCollapse}
          className="text-zinc-500 hover:text-zinc-300 hover:bg-[#1f1f1f] p-1.5 rounded-md transition-colors outline-none focus:ring-1 focus:ring-zinc-700"
        >
          <PanelLeft size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hidden-scrollbar flex flex-col gap-6 pt-2 pb-2">
        {/* Main Links */}
        <div
          className={`flex flex-col gap-[2px] ${isCollapsed ? "px-2 items-center" : "px-3"}`}
        >
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              title={isCollapsed ? link.name : undefined}
              className={`flex items-center rounded-md transition-colors ${isCollapsed ? "justify-center p-2 w-9 h-9" : "gap-3 px-3 py-2"} ${link.active ? "bg-[#2a2a2a] text-white shadow-none border border-transparent" : "hover:bg-[#1a1a1a] hover:text-zinc-100 hover:border-transparent border border-transparent"}`}
            >
              <img
                src={link.icon}
                alt={link.name}
                className="w-[18px] h-[18px] object-contain shrink-0"
              />
              {!isCollapsed && <span>{link.name}</span>}
            </Link>
          ))}
        </div>

        {/* Tools */}
        <div
          className={`flex flex-col gap-[2px] ${isCollapsed ? "px-2 items-center" : "px-3"}`}
        >
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3 py-1.5 mb-1 group cursor-pointer text-zinc-500 hover:text-zinc-300">
              <span className="text-[11px] font-medium uppercase tracking-wider">
                Tools
              </span>
            </div>
          )}
          {TOOLS_LINKS.map((tool) => {
            const IconComponent = tool.icon;

            if (onAddNode) {
              return (
                <button
                  key={tool.name}
                  onClick={() => onAddNode(tool.name)}
                  title={isCollapsed ? tool.name : undefined}
                  className={`flex items-center rounded-md transition-colors hover:bg-[#1a1a1a] hover:text-zinc-100 group outline-none ${isCollapsed ? "justify-center p-2 w-9 h-9" : "justify-between px-3 py-2"}`}
                >
                  <div
                    className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}
                  >
                    {typeof IconComponent === "string" ? (
                      <img
                        src={IconComponent}
                        alt={tool.name}
                        className="w-[18px] h-[18px] object-contain shrink-0"
                      />
                    ) : (
                      <IconComponent className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-100" />
                    )}
                    {!isCollapsed && <span>{tool.name}</span>}
                  </div>
                  {!isCollapsed && (
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
                title={isCollapsed ? tool.name : undefined}
                className={`flex items-center rounded-md transition-colors hover:bg-[#1a1a1a] hover:text-zinc-100 group cursor-pointer ${isCollapsed ? "justify-center p-2 w-9 h-9" : "justify-between px-3 py-2"}`}
              >
                <div
                  className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}
                >
                  {typeof IconComponent === "string" ? (
                    <img
                      src={IconComponent}
                      alt={tool.name}
                      className="w-[18px] h-[18px] object-contain shrink-0"
                    />
                  ) : (
                    <IconComponent className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-100" />
                  )}
                  {!isCollapsed && <span>{tool.name}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sign In Footer */}
      <div
        className={`mb-4 mt-auto flex px-3 ${isCollapsed ? "justify-center px-0" : ""}`}
      >
        {isLoaded ? (
          isSignedIn ? (
            <div className={`flex w-full items-center justify-between ${isCollapsed ? "justify-center p-0 bg-transparent border-transparent" : "px-2 py-1.5 bg-[#1a1a1a] rounded-xl border border-[#262626]"}`}>
              <div className="flex items-center min-w-0">
                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 shrink-0" } }} />
                {!isCollapsed && (
                  <span className="ml-3 text-[14px] font-medium text-white truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <SignOutButton>
                  <button className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors ml-1 shrink-0 rounded-md hover:bg-[#2a2a2a]" title="Sign Out">
                    <LogOut size={16} />
                  </button>
                </SignOutButton>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center justify-center bg-[#2563eb] hover:bg-[#3b82f6] text-white font-medium transition-colors shadow-sm ${
                isCollapsed
                  ? "w-full h-8 rounded-sm"
                  : "w-full h-12 rounded-xl text-[14px]"
              }`}
            >
              {isCollapsed ? <LogIn size={18} strokeWidth={2.5} /> : "Sign in"}
            </button>
          )
        ) : (
          <div className="w-full h-12 bg-[#1a1a1a] rounded-xl animate-pulse"></div>
        )}
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
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
