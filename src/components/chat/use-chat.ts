"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import {
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
  BrandSuggestions,
  CampaignAnswers,
} from "@/lib/types";

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
  const workflowRef = useRef<GenerateWorkflowResponse | null>(null);
  const workflowLoadingRef = useRef(false);
  const suggestionsRef = useRef<BrandSuggestions | null>(null);
  const answersRef = useRef<CampaignAnswers | null>(null);
  const streamingRef = useRef(false);

  const onboardingInput = useAppStore((s) => s.onboardingInput);
  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  const setDag = useAppStore((s) => s.setDag);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const setApproved = useAppStore((s) => s.setApproved);
  const addResult = useAppStore((s) => s.addResult);
  const updateResult = useAppStore((s) => s.updateResult);
  const setWorkflowResponse = useAppStore((s) => s.setWorkflowResponse);
  const setCampaignId = useAppStore((s) => s.setCampaignId);
  const setCampaignStats = useAppStore((s) => s.setCampaignStats);
  const chatSessionId = useAppStore((s) => s.chatSessionId);
  const setChatSessionId = useAppStore((s) => s.setChatSessionId);

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
            useAppStore.getState().updateMessage(msgId, stripCampaignAnswersBlock(accumulated));
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
        useAppStore.getState().updateMessage(msgId, stripCampaignAnswersBlock(accumulated));

        // Check for campaign_answers
        const answers = extractCampaignAnswers(accumulated);
        if (answers) {
          answersRef.current = answers;

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
    [chatSessionId, addMessage, setChatSessionId]
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

    const answers = answersRef.current;
    if (!answers) {
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content:
          "I need a bit more info before we can launch. Let me ask you a few more questions.",
        timestamp: Date.now(),
      });
      phaseRef.current = "chatting";
      setApproved(false);
      return;
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

    // Fire workflow generation in parallel
    workflowLoadingRef.current = true;
    const description = `Cold email outreach campaign for ${onboardingInput.brandUrl} to ${objectiveLabel}. ${
      onboardingInput.objectiveUrl
        ? `Target URL: ${onboardingInput.objectiveUrl}. `
        : ""
    }Budget: $${onboardingInput.budgetAmount} ${onboardingInput.budgetType}.`;

    generateWorkflow(description)
      .then((resp) => {
        workflowRef.current = resp;
        setWorkflowResponse(resp);
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
      })
      .catch((err) => {
        console.error("Workflow generation failed:", err);
        workflowLoadingRef.current = false;
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

      // Handle approval
      if (phase === "proposed" && isApprovalMessage(content)) {
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
