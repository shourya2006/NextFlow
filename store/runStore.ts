import { create } from "zustand";

interface RunStore {
  runningNodeIds: Set<string>;
  /** Returns true if ANY node is running */
  isRunning: boolean;
  setRunningIds: (ids: string[]) => void;
  clearRunning: () => void;
}

export const useRunStore = create<RunStore>((set) => ({
  runningNodeIds: new Set(),
  isRunning: false,
  setRunningIds: (ids) =>
    set({ runningNodeIds: new Set(ids), isRunning: ids.length > 0 }),
  clearRunning: () => set({ runningNodeIds: new Set(), isRunning: false }),
}));
