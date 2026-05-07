"use client";

import { useHistoryStore, WorkflowRun, NodeStatus } from "@/store/historyStore";
import { useThemeStore } from "@/store/themeStore";
import { 
  History, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  ChevronRight,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  Video,
  Wand2,
  Crop,
  Film
} from "lucide-react";

export default function WorkflowHistorySidebar() {
  const { runs, activeRunId, isHistoryOpen, setActiveRun, toggleHistory } = useHistoryStore();
  const theme = useThemeStore((s) => s.theme);
  const d = theme === "dark";

  const activeRun = runs.find((r) => r.id === activeRunId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-500 shrink-0" />;
    }
  };

  const getNodeIcon = (type: string) => {
    const props = { className: "w-3 h-3" };
    switch (type) {
      case "text": return <FileText {...props} />;
      case "image": return <ImageIcon {...props} />;
      case "video": return <Video {...props} />;
      case "llm": return <Wand2 {...props} />;
      case "crop": return <Crop {...props} />;
      case "frame": return <Film {...props} />;
      default: return <Clock {...props} />;
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
    <aside className={`fixed right-0 top-0 h-screen w-80 border-l z-50 flex flex-col shadow-2xl ${d ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-zinc-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between ${d ? 'border-zinc-800 bg-[#141414]' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2">
          <History className={`w-5 h-5 ${d ? 'text-zinc-400' : 'text-zinc-500'}`} />
          <h2 className={`font-semibold ${d ? 'text-zinc-100' : 'text-zinc-800'}`}>Workflow History</h2>
        </div>
        <button 
          onClick={toggleHistory}
          className={`p-1.5 rounded-md transition-colors ${d ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-500'}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!activeRun ? (
          <div className="p-4 space-y-4">
            <p className={`text-xs font-medium uppercase tracking-wider ${d ? 'text-zinc-500' : 'text-zinc-400'}`}>Recent Runs</p>
            {runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${d ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                  <PlayCircle className={`w-6 h-6 ${d ? 'text-zinc-700' : 'text-zinc-400'}`} />
                </div>
                <p className={`text-sm ${d ? 'text-zinc-400' : 'text-zinc-500'}`}>No runs recorded yet</p>
                <p className={`text-xs mt-1 ${d ? 'text-zinc-500' : 'text-zinc-400'}`}>Run your workflow to see history</p>
              </div>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setActiveRun(run.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all group ${d ? 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        <span className={`text-sm font-medium ${d ? 'text-zinc-200' : 'text-zinc-700'}`}>
                          Run {run.id.slice(0, 8)}
                        </span>
                      </div>
                      <span className={`text-[10px] ${d ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {formatRelativeTime(run.startedAt || Date.now())}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <p className={`text-[11px] ${d ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {(run.nodeRuns || []).length} nodes
                        </p>
                        {run.durationMs !== undefined && (
                          <p className={`text-[10px] font-mono ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            {Math.round(run.durationMs / 100) / 10}s
                          </p>
                        )}
                      </div>
                      <ChevronRight className={`w-3 h-3 transition-colors ${d ? 'text-zinc-600 group-hover:text-zinc-400' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
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
              className={`flex items-center gap-2 p-4 text-xs transition-colors border-b ${d ? 'text-zinc-400 hover:text-zinc-200 bg-[#141414] border-zinc-800' : 'text-zinc-500 hover:text-zinc-700 bg-zinc-50 border-zinc-200'}`}
            >
              <ChevronRight className="w-3 h-3 rotate-180" />
              Back to all runs
            </button>

            {/* Run Details */}
            <div className="p-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-sm font-semibold ${d ? 'text-zinc-100' : 'text-zinc-800'}`}>Run Details</h3>
                  {getStatusIcon(activeRun.status)}
                </div>
                <div className={`space-y-2 rounded-xl p-3 border ${d ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex justify-between text-[11px]">
                    <span className={d ? 'text-zinc-500' : 'text-zinc-400'}>Run ID</span>
                    <span className={`font-mono ${d ? 'text-zinc-300' : 'text-zinc-600'}`}>{activeRun.id}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className={d ? 'text-zinc-500' : 'text-zinc-400'}>Started</span>
                    <span className={d ? 'text-zinc-300' : 'text-zinc-600'}>{new Date(activeRun.startedAt || Date.now()).toLocaleTimeString()}</span>
                  </div>
                  {(activeRun.durationMs !== undefined || activeRun.endedAt) && (
                    <div className="flex justify-between text-[11px]">
                      <span className={d ? 'text-zinc-500' : 'text-zinc-400'}>Duration</span>
                      <span className={d ? 'text-zinc-300' : 'text-zinc-600'}>
                        {activeRun.durationMs !== undefined 
                          ? Math.round(activeRun.durationMs / 100) / 10 
                          : Math.round(((activeRun.endedAt || Date.now()) - (activeRun.startedAt || Date.now())) / 1000)}s
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className={`text-xs font-medium uppercase tracking-wider mb-3 flex items-center justify-between ${d ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  <span>Execution Order</span>
                  <span className="normal-case text-[10px]">{(activeRun.nodeRuns || []).length} steps</span>
                </h3>
                <div className="space-y-2 relative before:absolute before:inset-y-0 before:left-3.5 before:w-[2px] before:bg-zinc-200 dark:before:bg-zinc-800">
                  {/* Sort by executionOrder just in case */}
                  {[...(activeRun.nodeRuns || [])].sort((a, b) => a.executionOrder - b.executionOrder).map((info, idx) => (
                    <div 
                      key={`${info.nodeId}-${idx}`}
                      className={`relative flex items-start gap-3 p-3 rounded-xl border transition-colors ${d ? 'bg-[#141414] border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}
                    >
                      <div className={`mt-0.5 relative z-10 rounded-full p-0.5 ${d ? 'bg-[#141414]' : 'bg-white'}`}>
                        {getStatusIcon(info.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`flex items-center justify-center p-1 rounded-md ${d ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>
                                {getNodeIcon(info.type)}
                              </span>
                              <p className={`text-[13px] font-medium truncate ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                {info.label || info.nodeId}
                              </p>
                            </div>
                            <p className={`text-[10px] font-mono truncate ${d ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              {info.nodeId}
                            </p>
                          </div>
                          {info.durationMs !== undefined && (
                            <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-full ${d ? 'bg-zinc-800/50 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                              {Math.round(info.durationMs / 100) / 10}s
                            </span>
                          )}
                        </div>

                        {info.outputSummary && info.status === "success" && (
                          <div className={`mt-2 text-[11px] p-2 rounded-lg break-words whitespace-pre-wrap ${d ? 'bg-zinc-900/50 text-zinc-400' : 'bg-zinc-50 text-zinc-600'}`}>
                            {info.outputSummary}
                          </div>
                        )}

                        {info.error && (
                          <div className={`mt-2 text-[11px] p-2 rounded-lg break-words whitespace-pre-wrap border ${d ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {info.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(activeRun.nodeRuns || []).length === 0 && (
                    <div className="text-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-400 mb-2" />
                      <p className={`text-xs ${d ? 'text-zinc-500' : 'text-zinc-400'}`}>Waiting for execution to start...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
