import { create } from "zustand";

interface RunStore {
  runningNodeIds: Set<string>;
  activeNodeIds: Set<string>;
  setRunningIds: (ids: string[]) => void;
  setActiveNodeIds: (ids: string[]) => void;
  addActiveNodeId: (id: string) => void;
  removeActiveNodeId: (id: string) => void;
  clearRunning: () => void;
}

export const useRunStore = create<RunStore>((set) => ({
  runningNodeIds: new Set(),
  activeNodeIds: new Set(),
  setRunningIds: (ids) => set({ runningNodeIds: new Set(ids) }),
  setActiveNodeIds: (ids) => set((state) => {
    const current = state.activeNodeIds;
    // Skip update if the set contents are identical — avoids re-render + animation restart
    if (current.size === ids.length && ids.every((id) => current.has(id))) {
      return state;
    }
    return { activeNodeIds: new Set(ids) };
  }),
  addActiveNodeId: (id) => set((state) => {
    const next = new Set(state.activeNodeIds);
    next.add(id);
    return { activeNodeIds: next };
  }),
  removeActiveNodeId: (id) => set((state) => {
    const next = new Set(state.activeNodeIds);
    next.delete(id);
    return { activeNodeIds: next };
  }),
  clearRunning: () => set({ runningNodeIds: new Set(), activeNodeIds: new Set() }),
}));
