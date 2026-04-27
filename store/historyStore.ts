import { create } from "zustand";

export type NodeStatus = "pending" | "running" | "success" | "failed";

export interface WorkflowRun {
  id: string;
  workflowId: string;
  startTime: number;
  endTime?: number;
  status: "running" | "completed" | "failed";
  nodeStatuses: Record<string, {
    status: NodeStatus;
    label: string;
    error?: string;
  }>;
}

interface HistoryStore {
  runs: WorkflowRun[];
  activeRunId: string | null;
  isHistoryOpen: boolean;
  addRun: (run: WorkflowRun) => void;
  updateRun: (runId: string, updates: Partial<WorkflowRun>) => void;
  updateNodeStatus: (runId: string, nodeId: string, status: NodeStatus, error?: string) => void;
  setActiveRun: (runId: string | null) => void;
  setHistoryOpen: (open: boolean) => void;
  toggleHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  runs: [],
  activeRunId: null,
  isHistoryOpen: true, // Default to open for visibility
  addRun: (run) => set((state) => ({ 
    runs: [run, ...state.runs],
    activeRunId: run.id 
  })),
  updateRun: (runId, updates) => set((state) => ({
    runs: state.runs.map((r) => r.id === runId ? { ...r, ...updates } : r)
  })),
  updateNodeStatus: (runId, nodeId, status, error) => set((state) => ({
    runs: state.runs.map((r) => r.id === runId ? {
      ...r,
      nodeStatuses: {
        ...r.nodeStatuses,
        [nodeId]: {
          ...r.nodeStatuses[nodeId],
          status,
          error
        }
      }
    } : r)
  })),
  setActiveRun: (runId) => set({ activeRunId: runId }),
  setHistoryOpen: (open) => set({ isHistoryOpen: open }),
  toggleHistory: () => set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),
}));
