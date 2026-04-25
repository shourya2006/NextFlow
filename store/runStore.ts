import { create } from "zustand";

interface RunStore {
  isRunning: boolean;
  setIsRunning: (v: boolean) => void;
}

export const useRunStore = create<RunStore>((set) => ({
  isRunning: false,
  setIsRunning: (v) => set({ isRunning: v }),
}));
