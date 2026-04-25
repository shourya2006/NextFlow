import { create } from "zustand";

type Workflow = { id: string; title: string; updatedAt: string };

interface WorkflowStore {
  workflows: Workflow[];
  loading: boolean;
  searchQuery: string;

  setWorkflows: (workflows: Workflow[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchWorkflows: () => Promise<void>;
  filteredWorkflows: () => Workflow[];
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [],
  loading: true,
  searchQuery: "",

  setWorkflows: (workflows) => set({ workflows }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchWorkflows: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/workflows");
      if (res.ok) {
        const data = await res.json();
        set({ workflows: data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  filteredWorkflows: () => {
    const { workflows, searchQuery } = get();
    if (!searchQuery.trim()) return workflows;
    return workflows.filter((w) =>
      w.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  },
}));
