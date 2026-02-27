import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  OnboardingInput,
  ChatMessage,
  WorkflowDag,
  ResultRow,
  DashboardView,
  GenerateWorkflowResponse,
  BestWorkflowResponse,
  CampaignStats,
  CampaignAnswers,
} from "./types";
import type { CampaignSetup } from "./api-client";

type WorkflowResponseData = GenerateWorkflowResponse | BestWorkflowResponse;

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

  workflowResponse: WorkflowResponseData | null;
  setWorkflowResponse: (resp: WorkflowResponseData | null) => void;

  workflowError: string | null;
  setWorkflowError: (error: string | null) => void;

  campaignId: string | null;
  setCampaignId: (id: string | null) => void;

  campaignStats: CampaignStats | null;
  setCampaignStats: (stats: CampaignStats | null) => void;

  campaignAnswers: Partial<CampaignAnswers>;
  setCampaignAnswers: (answers: Partial<CampaignAnswers>) => void;
  setCampaignAnswer: (key: keyof CampaignAnswers, value: string) => void;
  clearCampaignAnswers: () => void;

  chatSessionId: string | null;
  setChatSessionId: (id: string | null) => void;

  updateMessage: (id: string, content: string) => void;
  updateMessageButtons: (id: string, buttons: Array<{ label: string; value: string }>) => void;

  hydrateFromServer: (setup: CampaignSetup) => void;
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

      workflowError: null,
      setWorkflowError: (error) => set({ workflowError: error }),

      campaignId: null,
      setCampaignId: (id) => set({ campaignId: id }),

      campaignStats: null,
      setCampaignStats: (stats) => set({ campaignStats: stats }),

      campaignAnswers: {},
      setCampaignAnswers: (answers) => set({ campaignAnswers: answers }),
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

      hydrateFromServer: (setup) =>
        set((state) => {
          const updates: Partial<AppState> = {};

          // Only fill missing local state — localStorage wins if it has data
          if (!state.onboardingInput && setup.brandUrl) {
            updates.onboardingInput = {
              brandUrl: setup.brandUrl,
              objective: (setup.objective as OnboardingInput["objective"]) ?? "responses",
              objectiveUrl: setup.objectiveUrl ?? undefined,
              budgetType: (setup.budgetType as OnboardingInput["budgetType"]) ?? "one-off",
              budgetAmount: Number(setup.budgetAmount) || 0,
              pricingTier: (setup.pricingTier as OnboardingInput["pricingTier"]) ?? "pay-as-you-go",
            };
          }

          if (Object.keys(state.campaignAnswers).length === 0 && setup.targetAudience) {
            updates.campaignAnswers = {
              target_audience: setup.targetAudience ?? undefined,
              value_for_target: setup.valueForTarget ?? undefined,
              urgency: setup.urgency ?? undefined,
              scarcity: setup.scarcity ?? undefined,
              risk_reversal: setup.riskReversal ?? undefined,
              social_proof: setup.socialProof ?? undefined,
            };
          }

          if (!state.chatSessionId && setup.chatSessionId) {
            updates.chatSessionId = setup.chatSessionId;
          }
          if (!state.campaignId && setup.campaignId) {
            updates.campaignId = setup.campaignId;
          }
          if (!state.isApproved && setup.isApproved) {
            updates.isApproved = true;
          }
          if (state.dashboardView === "dag" && setup.dashboardView && setup.dashboardView !== "dag") {
            updates.dashboardView = setup.dashboardView as DashboardView;
          }

          return Object.keys(updates).length > 0 ? updates : {};
        }),
    }),
    {
      name: "sales-cold-emails-store",
      partialize: (state) => ({
        onboardingInput: state.onboardingInput,
        messages: state.messages,
        currentDag: state.currentDag,
        isApproved: state.isApproved,
        dashboardView: state.dashboardView,
        workflowResponse: state.workflowResponse,
        campaignId: state.campaignId,
        campaignAnswers: state.campaignAnswers,
        chatSessionId: state.chatSessionId,
        results: state.results,
        campaignStats: state.campaignStats,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined;
        return {
          ...current,
          ...p,
          // Ensure arrays are always arrays after rehydration
          messages: Array.isArray(p?.messages) ? p.messages : [],
          results: Array.isArray(p?.results) ? p.results : [],
          // Ensure currentDag has valid arrays
          currentDag:
            p?.currentDag &&
            Array.isArray(p.currentDag.nodes) &&
            Array.isArray(p.currentDag.edges)
              ? p.currentDag
              : null,
        };
      },
    }
  )
);
