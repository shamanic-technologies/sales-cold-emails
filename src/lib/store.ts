import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  OnboardingInput,
  ChatMessage,
  WorkflowDag,
  ResultRow,
  DashboardView,
} from "./types";

interface AppState {
  onboardingInput: OnboardingInput | null;
  setOnboardingInput: (input: OnboardingInput) => void;

  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;

  currentDag: WorkflowDag | null;
  setDag: (dag: WorkflowDag) => void;

  results: ResultRow[];
  addResult: (row: ResultRow) => void;
  updateResult: (id: string, updates: Partial<ResultRow>) => void;
  clearResults: () => void;

  dashboardView: DashboardView;
  setDashboardView: (view: DashboardView) => void;

  selectedResultId: string | null;
  setSelectedResultId: (id: string | null) => void;

  isApproved: boolean;
  setApproved: (approved: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingInput: null,
      setOnboardingInput: (input) => set({ onboardingInput: input }),

      messages: [],
      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
      clearMessages: () => set({ messages: [] }),

      currentDag: null,
      setDag: (dag) => set({ currentDag: dag }),

      results: [],
      addResult: (row) =>
        set((state) => ({ results: [...state.results, row] })),
      updateResult: (id, updates) =>
        set((state) => ({
          results: state.results.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      clearResults: () => set({ results: [] }),

      dashboardView: "dag",
      setDashboardView: (view) => set({ dashboardView: view }),

      selectedResultId: null,
      setSelectedResultId: (id) => set({ selectedResultId: id }),

      isApproved: false,
      setApproved: (approved) => set({ isApproved: approved }),
    }),
    {
      name: "sales-cold-emails-store",
      partialize: (state) => ({
        onboardingInput: state.onboardingInput,
      }),
    }
  )
);
