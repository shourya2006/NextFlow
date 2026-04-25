"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "@/components/home/Sidebar";
import Hero from "@/components/home/Hero";
import Tabs from "@/components/home/Tabs";
import WorkflowsGrid from "@/components/home/WorkflowsGrid";
import EmptyState from "@/components/home/EmptyState";
import { useWorkflowStore } from "@/store/workflowStore";
import { useSidebarStore } from "@/store/sidebarStore";

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const {
    workflows,
    loading,
    searchQuery,
    setSearchQuery,
    fetchWorkflows,
    filteredWorkflows,
  } = useWorkflowStore();

  useEffect(() => {
    if (isLoaded) {
      fetchWorkflows();
    }
  }, [isLoaded, isSignedIn, user?.id]);

  const filtered = filteredWorkflows();

  return (
    <div className="flex w-full min-h-screen bg-[#111111] text-zinc-100 overflow-hidden font-sans">
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />

      {/* Main content — offset for desktop sidebar, padded top for mobile top bar */}
      <main
        className={`flex-1 flex flex-col bg-[#121212] transition-all duration-300
          pt-14 md:pt-0
          ${isCollapsed ? "md:ml-[56px]" : "md:ml-[260px]"}`}
      >
        <div className="flex flex-col w-full h-full overflow-y-auto hidden-scrollbar">
          <Hero />
          <Tabs
            hideControls={workflows.length === 0 && !loading}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
          />
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 py-20">
              Loading workflows...
            </div>
          ) : workflows.length > 0 ? (
            filtered.length > 0 ? (
              <WorkflowsGrid workflows={filtered} onWorkflowDeleted={fetchWorkflows} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500 py-20">
                No workflows match your search.
              </div>
            )
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      <style>{`
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
