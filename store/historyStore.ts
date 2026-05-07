import { create } from "zustand";

export type NodeStatus = "running" | "success" | "failed";

export interface NodeRunInfo {
  nodeId: string;
  label: string;
  type: string;
  status: NodeStatus;
  startedAt: number;        // timestamp ms
  endedAt?: number;          // timestamp ms
  durationMs?: number;
  outputSummary?: string;    // first ~200 chars
  error?: string;
  executionOrder: number;
}

export interface WorkflowRun {
  id: string;              // DB-generated cuid
  workflowId: string;
  status: "running" | "completed" | "failed";
  startedAt: number;       // timestamp ms
  endedAt?: number;
  durationMs?: number;
  nodeRuns: NodeRunInfo[];  // ordered by executionOrder
}

interface HistoryStore {
  runs: WorkflowRun[];
  activeRunId: string | null;
  isHistoryOpen: boolean;
  currentWorkflowId: string | null;

  // Actions
  setCurrentWorkflowId: (id: string) => void;
  loadRuns: (workflowId: string) => Promise<void>;
  addRun: (run: WorkflowRun) => void;
  updateRun: (runId: string, updates: Partial<WorkflowRun>) => void;
  addNodeRun: (runId: string, nodeRun: NodeRunInfo) => void;
  updateNodeRun: (runId: string, nodeId: string, updates: Partial<NodeRunInfo>) => void;
  setActiveRun: (runId: string | null) => void;
  setHistoryOpen: (open: boolean) => void;
  toggleHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  runs: [],
  activeRunId: null,
  isHistoryOpen: true,
  currentWorkflowId: null,

  setCurrentWorkflowId: (id) => set({ currentWorkflowId: id }),

  loadRuns: async (workflowId: string) => {
    try {
      const res = await fetch(`/api/runs?workflowId=${workflowId}`);
      if (!res.ok) return;
      const dbRuns = await res.json();

      const runs: WorkflowRun[] = dbRuns.map((r: any) => ({
        id: r.id,
        workflowId: r.workflowId,
        status: r.status,
        startedAt: new Date(r.startedAt).getTime(),
        endedAt: r.endedAt ? new Date(r.endedAt).getTime() : undefined,
        durationMs: r.durationMs,
        nodeRuns: (r.nodeRuns || []).map((nr: any) => ({
          nodeId: nr.nodeId,
          label: nr.label,
          type: nr.type,
          status: nr.status,
          startedAt: new Date(nr.startedAt).getTime(),
          endedAt: nr.endedAt ? new Date(nr.endedAt).getTime() : undefined,
          durationMs: nr.durationMs,
          outputSummary: nr.outputSummary,
          error: nr.error,
          executionOrder: nr.executionOrder,
        })),
      }));

      set({ runs, currentWorkflowId: workflowId });
    } catch (err) {
      console.error("Failed to load runs:", err);
    }
  },

  addRun: (run) =>
    set((state) => ({
      runs: [run, ...state.runs],
      activeRunId: run.id,
    })),

  updateRun: (runId, updates) =>
    set((state) => ({
      runs: state.runs.map((r) =>
        r.id === runId ? { ...r, ...updates } : r
      ),
    })),

  addNodeRun: (runId, nodeRun) =>
    set((state) => ({
      runs: state.runs.map((r) =>
        r.id === runId
          ? { ...r, nodeRuns: [...r.nodeRuns, nodeRun] }
          : r
      ),
    })),

  updateNodeRun: (runId, nodeId, updates) =>
    set((state) => ({
      runs: state.runs.map((r) =>
        r.id === runId
          ? {
              ...r,
              nodeRuns: r.nodeRuns.map((nr) =>
                nr.nodeId === nodeId ? { ...nr, ...updates } : nr
              ),
            }
          : r
      ),
    })),

  setActiveRun: (runId) => set({ activeRunId: runId }),
  setHistoryOpen: (open) => set({ isHistoryOpen: open }),
  toggleHistory: () =>
    set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),
}));
