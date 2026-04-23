"use client";

import { useState } from "react";
import Sidebar from "@/components/home/Sidebar";
import Hero from "@/components/home/Hero";
import Tabs from "@/components/home/Tabs";
import WorkflowsGrid from "@/components/home/WorkflowsGrid";
import EmptyState from "@/components/home/EmptyState";

export default function Home() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workflows, setWorkflows] = useState<
    { id: number; title: string; date: string }[]
  >([{ id: 1, title: "Untitled", date: "Edited 4 minutes ago" }]); // [{ id: 1, title: "Untitled", date: "Edited 4 minutes ago" }]

  return (
    <div className="flex w-full h-screen bg-[#111111] text-zinc-100 overflow-hidden font-sans">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      <main
        className={`flex-1 flex flex-col bg-[#121212] transition-all duration-300 ${isCollapsed ? "ml-[56px]" : "ml-[260px]"}`}
      >
        <div className="flex flex-col w-full h-full overflow-y-auto hidden-scrollbar">
          <Hero />
          <Tabs hideControls={workflows.length === 0} />
          {workflows.length > 0 ? (
            <WorkflowsGrid workflows={workflows} />
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}
