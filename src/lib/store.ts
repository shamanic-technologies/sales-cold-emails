import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  OnboardingInput,
  ChatMessage,
  WorkflowDag,
  ResultRow,
  DashboardView,
  GenerateWorkflowResponse,
  CampaignStats,
  CampaignAnswers,
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

  workflowResponse: GenerateWorkflowResponse | null;
  setWorkflowResponse: (resp: GenerateWorkflowResponse | null) => void;

  campaignId: string | null;
  setCampaignId: (id: string | null) => void;

  campaignStats: CampaignStats | null;
  setCampaignStats: (stats: CampaignStats | null) => void;

  campaignAnswers: Partial<CampaignAnswers>;
  setCampaignAnswer: (key: keyof CampaignAnswers, value: string) => void;
  clearCampaignAnswers: () => void;

  chatSessionId: string | null;
  setChatSessionId: (id: string | null) => void;

  updateMessage: (id: string, content: string) => void;
  updateMessageButtons: (id: string, buttons: Array<{ label: string; value: string }>) => void;
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

      workflowResponse: null,
      setWorkflowResponse: (resp) => set({ workflowResponse: resp }),

      campaignId: null,
      setCampaignId: (id) => set({ campaignId: id }),

      campaignStats: null,
      setCampaignStats: (stats) => set({ campaignStats: stats }),

      campaignAnswers: {},
      setCampaignAnswer: (key, value) =>
        set((state) => ({
          campaignAnswers: { ...state.campaignAnswers, [key]: value },
        })),
      clearCampaignAnswers: () => set({ campaignAnswers: {} }),

      chatSessionId: null,
      setChatSessionId: (id) => set({ chatSessionId: id }),

      updateMessage: (id, content) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, content } : m
          ),
        })),
      updateMessageButtons: (id, buttons) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, buttons } : m
          ),
        })),
    }),
    {
      name: "sales-cold-emails-store",
      partialize: (state) => ({
        onboardingInput: state.onboardingInput,
        workflowResponse: state.workflowResponse,
        campaignId: state.campaignId,
        chatSessionId: state.chatSessionId,
      }),
    }
  )
);
