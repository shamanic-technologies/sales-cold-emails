"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { generateWorkflow, createCampaign, connectCampaignStream } from "@/lib/api-client";
import { apiDagToWorkflowDag } from "@/lib/dag-transform";
import { generateModifiedDag } from "@/lib/mock-data";
import type { CreateCampaignRequest, GenerateWorkflowResponse } from "@/lib/types";

type ConversationState =
  | "scraping"
  | "ask_target_audience"
  | "ask_value_for_target"
  | "ask_urgency"
  | "ask_scarcity"
  | "ask_risk_reversal"
  | "ask_social_proof"
  | "proposed"
  | "approved"
  | "running";

const GATHERING_STATES: ConversationState[] = [
  "ask_target_audience",
  "ask_value_for_target",
  "ask_urgency",
  "ask_scarcity",
  "ask_risk_reversal",
  "ask_social_proof",
];

const QUESTION_PROMPTS: Record<string, string> = {
  ask_target_audience:
    "Who is your **target audience**? Describe your ideal customer profile — their role, industry, company size, and any other relevant characteristics.",
  ask_value_for_target:
    "What **value do you offer** to your target audience? What problem do you solve for them, and what makes your solution compelling?",
  ask_urgency:
    "Is there any **urgency** you can leverage? For example: limited-time pricing, upcoming deadlines, regulatory changes, or seasonal relevance.",
  ask_scarcity:
    "Do you have any **scarcity** elements? For example: limited spots, waitlist, exclusive access, or capacity constraints.",
  ask_risk_reversal:
    "What **risk reversal** can you offer? For example: free trial, money-back guarantee, free consultation, or a demo with no commitment.",
  ask_social_proof:
    "What **social proof** can you share? For example: customer logos, case studies, metrics (e.g., '3x more replies'), awards, or testimonials.",
};

export function useChat() {
  const stateRef = useRef<ConversationState>("scraping");
  const cleanupRef = useRef<(() => void) | null>(null);
  const initRef = useRef(false);
  const gatheredRef = useRef<Record<string, string>>({});
  const workflowRef = useRef<GenerateWorkflowResponse | null>(null);
  const workflowLoadingRef = useRef(false);

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

  useEffect(() => {
    if (initRef.current || messages.length > 0 || !onboardingInput) return;
    initRef.current = true;

    stateRef.current = "scraping";

    const brandDomain = (() => {
      try {
        return new URL(onboardingInput.brandUrl).hostname;
      } catch {
        return onboardingInput.brandUrl;
      }
    })();

    const objectiveLabel =
      onboardingInput.objective === "responses"
        ? "maximize email replies"
        : onboardingInput.objective === "clicks"
          ? "drive link clicks"
          : "book meetings";

    addMessage({
      id: crypto.randomUUID(),
      role: "system",
      content: `Welcome! I'm analyzing **${brandDomain}** and generating a custom workflow to **${objectiveLabel}**...\n\nWhile I work on that, let me ask you a few questions to craft the perfect cold email campaign.`,
      timestamp: Date.now(),
    });

    // Fire workflow generation in parallel with questions
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
      })
      .catch((err) => {
        console.error("Workflow generation failed:", err);
        workflowLoadingRef.current = false;
      });

    // Ask first question after a brief delay
    setTimeout(() => {
      stateRef.current = "ask_target_audience";
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `Great, I'm on it! Now let's dial in your campaign.\n\n${QUESTION_PROMPTS.ask_target_audience}`,
        timestamp: Date.now(),
      });
    }, 1500);
  }, [onboardingInput, messages.length, addMessage, setWorkflowResponse]);

  const proposeDag = useCallback(() => {
    const resp = workflowRef.current;
    if (!resp) return;

    const dag = apiDagToWorkflowDag(resp.dag);
    setDag(dag);

    const objectiveLabel =
      onboardingInput?.objective === "responses"
        ? "maximize email replies"
        : onboardingInput?.objective === "clicks"
          ? "drive link clicks"
          : "book meetings";

    addMessage({
      id: crypto.randomUUID(),
      role: "system",
      content: `Excellent! I have everything I need. I've generated a custom **${resp.workflow.signatureName}** workflow to **${objectiveLabel}**.\n\n${resp.generatedDescription}\n\nTake a look at the workflow on the right. Say **"go"** to start the campaign, or tell me what you'd like to change.`,
      timestamp: Date.now(),
    });
  }, [addMessage, setDag, onboardingInput]);

  const sendMessage = useCallback(
    async (content: string) => {
      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      });

      await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));

      const state = stateRef.current;

      // Handle gathering phase
      if (GATHERING_STATES.includes(state)) {
        gatheredRef.current[state] = content;

        const currentIndex = GATHERING_STATES.indexOf(state);
        const nextState = GATHERING_STATES[currentIndex + 1];

        if (nextState) {
          stateRef.current = nextState;
          addMessage({
            id: crypto.randomUUID(),
            role: "system",
            content: `Got it! ${QUESTION_PROMPTS[nextState]}`,
            timestamp: Date.now(),
          });
        } else {
          // All questions answered — check if workflow is ready
          if (workflowLoadingRef.current) {
            addMessage({
              id: crypto.randomUUID(),
              role: "system",
              content: "Finalizing your workflow...",
              timestamp: Date.now(),
            });

            // Poll until workflow is ready
            const waitForWorkflow = () => {
              if (!workflowLoadingRef.current && workflowRef.current) {
                stateRef.current = "proposed";
                proposeDag();
              } else {
                setTimeout(waitForWorkflow, 500);
              }
            };
            waitForWorkflow();
          } else {
            stateRef.current = "proposed";
            proposeDag();
          }
        }
        return;
      }

      // Handle approval
      const lower = content.toLowerCase();
      const isApproval =
        lower.includes("go") ||
        lower.includes("start") ||
        lower.includes("launch") ||
        lower.includes("run") ||
        lower.includes("approve") ||
        lower === "yes" ||
        lower === "ok" ||
        lower === "lgtm";

      if (state === "proposed" && isApproval) {
        setApproved(true);
        setDashboardView("results");
        stateRef.current = "running";

        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          content:
            "Workflow approved! Creating your campaign and starting execution. Watch the **Results** tab to see prospects being processed in real-time.",
          timestamp: Date.now(),
        });

        // Build budget fields from onboarding input
        const budgetFields = (() => {
          const amount = onboardingInput!.budgetAmount;
          switch (onboardingInput!.budgetType) {
            case "one-off":
              return { maxBudgetTotalUsd: amount };
            case "daily":
              return { maxBudgetDailyUsd: amount };
            case "weekly":
              return { maxBudgetWeeklyUsd: amount };
            case "monthly":
              return { maxBudgetMonthlyUsd: amount };
          }
        })();

        const objectiveLabel =
          onboardingInput?.objective === "responses"
            ? "Maximize email replies"
            : onboardingInput?.objective === "clicks"
              ? "Drive link clicks"
              : "Book meetings";

        const brandDomain = (() => {
          try {
            return new URL(onboardingInput!.brandUrl).hostname;
          } catch {
            return onboardingInput!.brandUrl;
          }
        })();

        try {
          const campaignRequest: CreateCampaignRequest = {
            name: `Campaign for ${brandDomain}`,
            workflowName: workflowRef.current?.workflow.name ?? "sales-email-cold-outreach-mock",
            brandUrl: onboardingInput!.brandUrl,
            targetAudience: gatheredRef.current.ask_target_audience ?? "",
            targetOutcome: objectiveLabel,
            valueForTarget: gatheredRef.current.ask_value_for_target ?? "",
            urgency: gatheredRef.current.ask_urgency ?? "",
            scarcity: gatheredRef.current.ask_scarcity ?? "",
            riskReversal: gatheredRef.current.ask_risk_reversal ?? "",
            socialProof: gatheredRef.current.ask_social_proof ?? "",
            ...budgetFields,
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
                    companyName: parsed.data.companyName ?? parsed.data.company_name ?? "",
                    personName: parsed.data.personName ?? parsed.data.person_name ?? "",
                    personTitle: parsed.data.personTitle ?? parsed.data.person_title ?? "",
                    email: parsed.data.email ?? "",
                    status: parsed.data.status ?? "queued",
                    emailSubject: parsed.data.emailSubject ?? parsed.data.email_subject,
                    emailBody: parsed.data.emailBody ?? parsed.data.email_body,
                    timestamp: parsed.data.timestamp ?? Date.now(),
                  });
                  break;

                case "lead_update":
                  updateResult(parsed.data.id, {
                    status: parsed.data.status,
                    ...(parsed.data.emailSubject ? { emailSubject: parsed.data.emailSubject } : {}),
                    ...(parsed.data.emailBody ? { emailBody: parsed.data.emailBody } : {}),
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
                    content: "Campaign execution complete! Check the **Results** tab for the full report.",
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
          stateRef.current = "proposed";
          setApproved(false);
          setDashboardView("dag");
        }
      } else if (state === "running") {
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          content:
            "The campaign is currently running. Check the **Results** tab to see live progress.",
          timestamp: Date.now(),
        });
      } else {
        // Workflow modification feedback
        const newDag = generateModifiedDag(content);
        setDag(newDag);
        stateRef.current = "proposed";

        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          content: `I've updated the workflow based on your feedback. Take a look at the updated DAG on the right.\n\nSay **"go"** when you're ready to launch, or tell me what else you'd like to change.`,
          timestamp: Date.now(),
        });
      }
    },
    [
      addMessage,
      setDag,
      setApproved,
      setDashboardView,
      onboardingInput,
      addResult,
      updateResult,
      setCampaignId,
      setCampaignStats,
      setWorkflowResponse,
      proposeDag,
    ]
  );

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return { sendMessage };
}
