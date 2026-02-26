"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import {
  getBestWorkflow,
  generateWorkflow,
  createCampaign,
  connectCampaignStream,
  scrapeBrand,
  sendChatMessage,
} from "@/lib/api-client";
import { apiDagToWorkflowDag } from "@/lib/dag-transform";
import type {
  CreateCampaignRequest,
  GenerateWorkflowResponse,
  BestWorkflowResponse,
  BrandSuggestions,
  CampaignAnswers,
} from "@/lib/types";

/** Common shape stored in workflowRef — both best and generated have these */
type WorkflowData = {
  workflow: { name: string; id: string; signatureName: string };
  dag: GenerateWorkflowResponse["dag"];
};

// --- Helpers ---

function extractCampaignAnswers(text: string): CampaignAnswers | null {
  const pattern = /```campaign_answers\s*\n([\s\S]*?)\n```/;
  const match = text.match(pattern);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as CampaignAnswers;
  } catch {
    return null;
  }
}

function stripCampaignAnswersBlock(text: string): string {
  return text.replace(/```campaign_answers\s*\n[\s\S]*?\n```\s*/g, "").trim();
}

function extractWorkflowHint(text: string): string | null {
  const pattern = /```workflow_hint\s*\n([\s\S]*?)\n```/;
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

function stripHiddenBlocks(text: string): string {
  return text
    .replace(/```campaign_answers\s*\n[\s\S]*?\n```\s*/g, "")
    .replace(/```workflow_hint\s*\n[\s\S]*?\n```\s*/g, "")
    .trim();
}

async function* parseSSEStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<{ type: string; [key: string]: unknown }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === '"[DONE]"') {
          yield { type: "done" };
          return;
        }
        try {
          yield JSON.parse(data);
        } catch {
          // skip malformed
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getObjectiveLabel(objective: string): string {
  return objective === "responses" ? "maximize email replies" : "drive link clicks";
}

function buildBudgetFields(input: { budgetType: string; budgetAmount: number }) {
  switch (input.budgetType) {
    case "one-off":
      return { maxBudgetTotalUsd: input.budgetAmount };
    case "daily":
      return { maxBudgetDailyUsd: input.budgetAmount };
    case "weekly":
      return { maxBudgetWeeklyUsd: input.budgetAmount };
    case "monthly":
      return { maxBudgetMonthlyUsd: input.budgetAmount };
    default:
      return {};
  }
}

function isApprovalMessage(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes("go") ||
    lower.includes("start") ||
    lower.includes("launch") ||
    lower.includes("run") ||
    lower.includes("approve") ||
    lower === "yes" ||
    lower === "ok" ||
    lower === "lgtm"
  );
}

type Phase = "init" | "chatting" | "proposed" | "approved" | "running";

export function useChat() {
  const phaseRef = useRef<Phase>("init");
  const cleanupRef = useRef<(() => void) | null>(null);
  const initRef = useRef(false);
  const workflowRef = useRef<WorkflowData | null>(null);
  const workflowLoadingRef = useRef(false);
  const suggestionsRef = useRef<BrandSuggestions | null>(null);
  const answersRef = useRef<CampaignAnswers | null>(null);
  const streamingRef = useRef(false);

  const onboardingInput = useAppStore((s) => s.onboardingInput);
  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  const setDag = useAppStore((s) => s.setDag);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const isApproved = useAppStore((s) => s.isApproved);
  const setApproved = useAppStore((s) => s.setApproved);
  const addResult = useAppStore((s) => s.addResult);
  const updateResult = useAppStore((s) => s.updateResult);
  const workflowResponse = useAppStore((s) => s.workflowResponse);
  const setWorkflowResponse = useAppStore((s) => s.setWorkflowResponse);
  const setWorkflowError = useAppStore((s) => s.setWorkflowError);
  const campaignId = useAppStore((s) => s.campaignId);
  const setCampaignId = useAppStore((s) => s.setCampaignId);
  const setCampaignStats = useAppStore((s) => s.setCampaignStats);
  const campaignAnswers = useAppStore((s) => s.campaignAnswers);
  const setCampaignAnswers = useAppStore((s) => s.setCampaignAnswers);
  const chatSessionId = useAppStore((s) => s.chatSessionId);
  const setChatSessionId = useAppStore((s) => s.setChatSessionId);

  // Restore refs from persisted state on mount
  useEffect(() => {
    if (workflowResponse) {
      workflowRef.current = workflowResponse;
      workflowLoadingRef.current = false;
    }
    if (campaignAnswers && Object.keys(campaignAnswers).length === 6) {
      answersRef.current = campaignAnswers as CampaignAnswers;
    }
    if (campaignId) {
      phaseRef.current = "running";
    } else if (answersRef.current) {
      phaseRef.current = "proposed";
    } else if (messages.length > 0) {
      phaseRef.current = "chatting";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Regenerate workflow when chat-service returns a workflow_hint ---
  const regenerateWorkflow = useCallback(async (hint: string) => {
    workflowLoadingRef.current = true;
    addMessage({
      id: crypto.randomUUID(),
      role: "system",
      content: "Regenerating your workflow based on your changes...",
      timestamp: Date.now(),
    });

    const objectiveLabel = getObjectiveLabel(onboardingInput!.objective);
    const description = `${hint}. Campaign for ${onboardingInput!.brandUrl} to ${objectiveLabel}.`;

    try {
      const resp = await generateWorkflow(description);
      workflowRef.current = resp;
      setWorkflowResponse(resp);
      workflowLoadingRef.current = false;

      const dag = apiDagToWorkflowDag(resp.dag);
      setDag(dag);

      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: "Workflow updated! Check the DAG on the right.",
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("Workflow regeneration failed:", err);
      workflowLoadingRef.current = false;
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: "Failed to update the workflow. You can try again or launch with the current one.",
        timestamp: Date.now(),
      });
    }
  }, [onboardingInput, addMessage, setWorkflowResponse, setDag]);

  // --- Stream a chat response from the chat-service ---
  const streamChatResponse = useCallback(
    async (message: string, context?: Record<string, unknown>) => {
      streamingRef.current = true;
      try {
        const response = await sendChatMessage({
          message,
          sessionId: chatSessionId ?? undefined,
          context,
        });

        if (!response.body) {
          throw new Error("No response body");
        }

        // Create a placeholder system message for live streaming
        const msgId = crypto.randomUUID();
        addMessage({
          id: msgId,
          role: "system",
          content: "",
          timestamp: Date.now(),
        });

        let accumulated = "";

        for await (const event of parseSSEStream(response.body)) {
          // First event: sessionId
          if ("sessionId" in event && typeof event.sessionId === "string") {
            if (!chatSessionId) {
              setChatSessionId(event.sessionId);
            }
            continue;
          }

          if (event.type === "token" && typeof event.content === "string") {
            accumulated += event.content;
            useAppStore.getState().updateMessage(msgId, stripHiddenBlocks(accumulated));
            continue;
          }

          if (event.type === "buttons" && Array.isArray(event.buttons)) {
            useAppStore
              .getState()
              .updateMessageButtons(
                msgId,
                event.buttons as Array<{ label: string; value: string }>
              );
            continue;
          }

          if (event.type === "done") {
            break;
          }
        }

        // Final display text
        useAppStore.getState().updateMessage(msgId, stripHiddenBlocks(accumulated));

        // Check for campaign_answers
        const answers = extractCampaignAnswers(accumulated);
        if (answers) {
          answersRef.current = answers;
          setCampaignAnswers(answers);

          // If workflow is also ready, transition to proposed
          if (!workflowLoadingRef.current && workflowRef.current) {
            phaseRef.current = "proposed";
          } else {
            const waitForWorkflow = () => {
              if (!workflowLoadingRef.current && workflowRef.current) {
                phaseRef.current = "proposed";
              } else {
                setTimeout(waitForWorkflow, 500);
              }
            };
            waitForWorkflow();
          }
        }

        // Check for workflow_hint — regenerate workflow if found
        const workflowHint = extractWorkflowHint(accumulated);
        if (workflowHint) {
          await regenerateWorkflow(workflowHint);
        }
      } catch (err) {
        console.error("Chat stream error:", err);
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: Date.now(),
        });
      } finally {
        streamingRef.current = false;
      }
    },
    [chatSessionId, addMessage, setChatSessionId, setCampaignAnswers, regenerateWorkflow]
  );

  // --- Launch campaign (preserved from original) ---
  const launchCampaign = useCallback(async () => {
    addMessage({
      id: crypto.randomUUID(),
      role: "system",
      content:
        "Workflow approved! Creating your campaign and starting execution. Watch the **Results** tab to see prospects being processed in real-time.",
      timestamp: Date.now(),
    });

    let answers = answersRef.current;
    if (!answers) {
      // Fall back to store's partial answers with defaults
      const stored = useAppStore.getState().campaignAnswers;
      if (stored && Object.keys(stored).length > 0) {
        answers = {
          target_audience: stored.target_audience ?? "General audience",
          value_for_target: stored.value_for_target ?? "Our product/service",
          urgency: stored.urgency ?? "Limited time offer",
          scarcity: stored.scarcity ?? "Limited availability",
          risk_reversal: stored.risk_reversal ?? "Money-back guarantee",
          social_proof: stored.social_proof ?? "Trusted by many companies",
        };
        answersRef.current = answers;
      } else {
        // No answers at all — use defaults based on onboarding input
        answers = {
          target_audience: "Decision makers at target companies",
          value_for_target: `What ${extractDomain(onboardingInput!.brandUrl)} offers`,
          urgency: "Limited time offer",
          scarcity: "Limited availability",
          risk_reversal: "No risk to try",
          social_proof: "Trusted by growing companies",
        };
        answersRef.current = answers;
      }
    }

    const brandDomain = extractDomain(onboardingInput!.brandUrl);
    const objectiveLabel =
      onboardingInput?.objective === "responses"
        ? "Maximize email replies"
        : "Drive link clicks";

    try {
      const campaignRequest: CreateCampaignRequest = {
        name: `Campaign for ${brandDomain}`,
        workflowName:
          workflowRef.current?.workflow.name ??
          "sales-email-cold-outreach-mock",
        brandUrl: onboardingInput!.brandUrl,
        targetAudience: answers.target_audience,
        targetOutcome: objectiveLabel,
        valueForTarget: answers.value_for_target,
        urgency: answers.urgency,
        scarcity: answers.scarcity,
        riskReversal: answers.risk_reversal,
        socialProof: answers.social_proof,
        ...buildBudgetFields(onboardingInput!),
      };

      const campaign = await createCampaign(campaignRequest);
      setCampaignId(campaign.id);

      // Connect to SSE stream
      const es = connectCampaignStream(campaign.id);

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          switch (parsed.type) {
            case "lead":
              addResult({
                id: parsed.data.id,
                companyName:
                  parsed.data.companyName ?? parsed.data.company_name ?? "",
                personName:
                  parsed.data.personName ?? parsed.data.person_name ?? "",
                personTitle:
                  parsed.data.personTitle ?? parsed.data.person_title ?? "",
                email: parsed.data.email ?? "",
                status: parsed.data.status ?? "queued",
                emailSubject:
                  parsed.data.emailSubject ?? parsed.data.email_subject,
                emailBody: parsed.data.emailBody ?? parsed.data.email_body,
                timestamp: parsed.data.timestamp ?? Date.now(),
              });
              break;

            case "lead_update":
              updateResult(parsed.data.id, {
                status: parsed.data.status,
                ...(parsed.data.emailSubject
                  ? { emailSubject: parsed.data.emailSubject }
                  : {}),
                ...(parsed.data.emailBody
                  ? { emailBody: parsed.data.emailBody }
                  : {}),
              });
              break;

            case "stats":
              setCampaignStats(parsed.data);
              break;

            case "done":
              es.close();
              addMessage({
                id: crypto.randomUUID(),
                role: "system",
                content:
                  "Campaign execution complete! Check the **Results** tab for the full report.",
                timestamp: Date.now(),
              });
              break;
          }
        } catch {
          // Skip malformed events
        }
      };

      es.onerror = () => {
        es.close();
      };

      cleanupRef.current = () => es.close();
    } catch (err) {
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `Failed to create campaign: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
        timestamp: Date.now(),
      });
      phaseRef.current = "proposed";
      setApproved(false);
      setDashboardView("dag");
    }
  }, [
    onboardingInput,
    addMessage,
    setCampaignId,
    setApproved,
    setDashboardView,
    addResult,
    updateResult,
    setCampaignStats,
  ]);

  // --- Initialization: scrape brand + generate workflow + first chat message ---
  useEffect(() => {
    if (initRef.current || messages.length > 0 || !onboardingInput) return;
    initRef.current = true;
    phaseRef.current = "init";

    const brandDomain = extractDomain(onboardingInput.brandUrl);
    const objectiveLabel = getObjectiveLabel(onboardingInput.objective);

    // Fetch best workflow (instant) — fall back to generate (slow) on 404
    workflowLoadingRef.current = true;
    const apiObjective = onboardingInput.objective === "responses" ? "replies" : "clicks";

    const handleWorkflowReady = (resp: GenerateWorkflowResponse | BestWorkflowResponse) => {
      workflowRef.current = resp;
      setWorkflowResponse(resp);
      setWorkflowError(null);
      workflowLoadingRef.current = false;

      const dag = apiDagToWorkflowDag(resp.dag);
      setDag(dag);

      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content:
          "Your workflow is ready! Take a look at the DAG on the right. Keep chatting below so I can fine-tune your campaign.",
        timestamp: Date.now(),
      });
    };

    getBestWorkflow(apiObjective)
      .then(handleWorkflowReady)
      .catch((err) => {
        console.warn("Best workflow not available, falling back to generate:", err.message);
        // Fallback: generate a new workflow (slow, LLM-based)
        const description = `Cold email outreach campaign for ${onboardingInput.brandUrl} to ${objectiveLabel}. ${
          onboardingInput.objectiveUrl
            ? `Target URL: ${onboardingInput.objectiveUrl}. `
            : ""
        }Budget: $${onboardingInput.budgetAmount} ${onboardingInput.budgetType}.`;

        generateWorkflow(description)
          .then(handleWorkflowReady)
          .catch((genErr) => {
            console.error("Workflow generation failed:", genErr);
            workflowLoadingRef.current = false;
            setWorkflowError("Could not load workflow. You can continue chatting — the workflow will be retried when you modify it.");
            addMessage({
              id: crypto.randomUUID(),
              role: "system",
              content: "I couldn't load a workflow right now, but don't worry — keep chatting and we'll set one up for your campaign.",
              timestamp: Date.now(),
            });
          });
      });

    // Fire brand scraping, then send first chat message with full context
    scrapeBrand(onboardingInput.brandUrl)
      .then((suggestions) => {
        suggestionsRef.current = suggestions;
      })
      .catch((err) => {
        console.error("Brand scrape failed:", err);
      })
      .finally(() => {
        phaseRef.current = "chatting";

        const context = {
          onboardingInput,
          brandSuggestions: suggestionsRef.current,
        };

        streamChatResponse(
          `I want to create a cold email campaign for ${brandDomain} to ${objectiveLabel}.`,
          context
        );
      });
  }, [
    onboardingInput,
    messages.length,
    addMessage,
    setWorkflowResponse,
    setWorkflowError,
    setDag,
    streamChatResponse,
  ]);

  // --- Send user message ---
  const sendMessage = useCallback(
    async (content: string) => {
      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      });

      const phase = phaseRef.current;

      // Handle approval — allow in both "proposed" and "chatting" phases
      // In "chatting" phase, the LLM may have collected answers without the
      // structured campaign_answers block, so we launch if the workflow is ready
      if (
        (phase === "proposed" || phase === "chatting") &&
        isApprovalMessage(content) &&
        workflowRef.current &&
        !workflowLoadingRef.current
      ) {
        // Build answers from ref or fall back to store
        if (!answersRef.current) {
          const stored = useAppStore.getState().campaignAnswers;
          if (stored && Object.keys(stored).length > 0) {
            answersRef.current = {
              target_audience: stored.target_audience ?? "General audience",
              value_for_target: stored.value_for_target ?? "Our product/service",
              urgency: stored.urgency ?? "Limited time offer",
              scarcity: stored.scarcity ?? "Limited availability",
              risk_reversal: stored.risk_reversal ?? "Money-back guarantee",
              social_proof: stored.social_proof ?? "Trusted by many companies",
            };
          }
        }

        setApproved(true);
        setDashboardView("results");
        phaseRef.current = "running";
        await launchCampaign();
        return;
      }

      if (phase === "running") {
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          content:
            "The campaign is currently running. Check the **Results** tab to see live progress.",
          timestamp: Date.now(),
        });
        return;
      }

      // For all other states: send to chat-service
      const context = {
        onboardingInput,
        brandSuggestions: suggestionsRef.current,
      };
      await streamChatResponse(content, context);
    },
    [
      addMessage,
      streamChatResponse,
      onboardingInput,
      setApproved,
      setDashboardView,
      launchCampaign,
    ]
  );

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return { sendMessage, isStreaming: streamingRef.current };
}
