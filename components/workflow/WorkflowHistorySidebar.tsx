"use client";

import { useHistoryStore, WorkflowRun, NodeStatus } from "@/store/historyStore";
import { 
  History, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  ChevronRight,
  PlayCircle
} from "lucide-react";

export default function WorkflowHistorySidebar() {
  const { runs, activeRunId, isHistoryOpen, setActiveRun, toggleHistory } = useHistoryStore();

  const activeRun = runs.find((r) => r.id === activeRunId);

  const getStatusIcon = (status: NodeStatus | WorkflowRun["status"]) => {
    switch (status) {
      case "success":
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-500" />;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!isHistoryOpen) return null;

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 bg-[#0f0f0f] border-l border-zinc-800 z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#141414]">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-zinc-400" />
          <h2 className="font-semibold text-zinc-100">Workflow History</h2>
        </div>
        <button 
          onClick={toggleHistory}
          className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!activeRun ? (
          <div className="p-4 space-y-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Recent Runs</p>
            {runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3">
                  <PlayCircle className="w-6 h-6 text-zinc-700" />
                </div>
                <p className="text-sm text-zinc-400">No runs recorded yet</p>
                <p className="text-xs text-zinc-500 mt-1">Run your workflow to see history</p>
              </div>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setActiveRun(run.id)}
                    className="w-full text-left p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        <span className="text-sm font-medium text-zinc-200">
                          Run {run.id.slice(0, 6)}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {formatRelativeTime(run.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-zinc-500">
                        {Object.keys(run.nodeStatuses).length} nodes executed
                      </p>
                      <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Back button */}
            <button 
              onClick={() => setActiveRun(null)}
              className="flex items-center gap-2 p-4 text-xs text-zinc-400 hover:text-zinc-200 transition-colors bg-[#141414] border-b border-zinc-800"
            >
              <ChevronRight className="w-3 h-3 rotate-180" />
              Back to all runs
            </button>

            {/* Run Details */}
            <div className="p-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-100">Run Details</h3>
                  {getStatusIcon(activeRun.status)}
                </div>
                <div className="space-y-2 bg-zinc-900/30 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500">Run ID</span>
                    <span className="text-zinc-300 font-mono">{activeRun.id}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500">Started</span>
                    <span className="text-zinc-300">{new Date(activeRun.startTime).toLocaleTimeString()}</span>
                  </div>
                  {activeRun.endTime && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">Duration</span>
                      <span className="text-zinc-300">
                        {Math.round((activeRun.endTime - activeRun.startTime) / 1000)}s
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Nodes</h3>
                <div className="space-y-2">
                  {Object.entries(activeRun.nodeStatuses).map(([nodeId, info]) => (
                    <div 
                      key={nodeId}
                      className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/30"
                    >
                      <div className="mt-0.5">
                        {getStatusIcon(info.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-zinc-200 truncate">
                          {info.label || nodeId}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate">
                          {nodeId}
                        </p>
                        {info.error && (
                          <p className="text-[10px] text-rose-400 mt-1 line-clamp-2 bg-rose-500/5 p-1 rounded">
                            {info.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
