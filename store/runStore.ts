import { create } from "zustand";

interface RunStore {
  runningNodeIds: Set<string>;
  /** The single node currently being executed */
  currentNodeId: string | null;
  /** Returns true if ANY node is running */
  isRunning: boolean;
  setRunningIds: (ids: string[]) => void;
  setCurrentNodeId: (id: string | null) => void;
  clearRunning: () => void;
}

export const useRunStore = create<RunStore>((set) => ({
  runningNodeIds: new Set(),
  currentNodeId: null,
  isRunning: false,
  setRunningIds: (ids) =>
    set({ runningNodeIds: new Set(ids), isRunning: ids.length > 0 }),
  setCurrentNodeId: (id) =>
    set({ currentNodeId: id }),
  clearRunning: () => set({ runningNodeIds: new Set(), currentNodeId: null, isRunning: false }),
}));
