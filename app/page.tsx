"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "@/components/home/Sidebar";
import Hero from "@/components/home/Hero";
import Tabs from "@/components/home/Tabs";
import WorkflowsGrid from "@/components/home/WorkflowsGrid";
import EmptyState from "@/components/home/EmptyState";

type Workflow = { id: string; title: string; updatedAt: string };

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchWorkflows();
    }
  }, [isLoaded, isSignedIn, user?.id]);

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
          <Tabs hideControls={workflows.length === 0 && !loading} searchQuery={searchQuery} onSearch={setSearchQuery} />
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">Loading workflows...</div>
          ) : workflows.length > 0 ? (
            workflows.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
              <WorkflowsGrid workflows={workflows.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()))} onWorkflowDeleted={fetchWorkflows} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">No workflows match your search.</div>
            )
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}
