"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import {
  generateInitialDag,
  generateModifiedDag,
  startResultsSimulation,
} from "@/lib/mock-data";

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

export function useMockChat() {
  const stateRef = useRef<ConversationState>("scraping");
  const cleanupRef = useRef<(() => void) | null>(null);
  const initRef = useRef(false);
  const gatheredRef = useRef<Record<string, string>>({});

  const onboardingInput = useAppStore((s) => s.onboardingInput);
  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  const setDag = useAppStore((s) => s.setDag);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const setApproved = useAppStore((s) => s.setApproved);
  const addResult = useAppStore((s) => s.addResult);
  const updateResult = useAppStore((s) => s.updateResult);

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

    addMessage({
      id: crypto.randomUUID(),
      role: "system",
      content: `Welcome! I'm analyzing **${brandDomain}** to understand your brand, offering, and positioning...\n\nWhile I scrape your website, let me ask you a few questions to craft the perfect cold email campaign.`,
      timestamp: Date.now(),
    });

    // Simulate scraping delay, then ask first question
    setTimeout(() => {
      stateRef.current = "ask_target_audience";
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `Brand analysis complete! I've identified your key value propositions and tone.\n\nNow let's dial in your campaign. ${QUESTION_PROMPTS.ask_target_audience}`,
        timestamp: Date.now(),
      });
    }, 2500);
  }, [onboardingInput, messages.length, addMessage]);

  const sendMessage = useCallback(
    async (content: string) => {
      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      });

      // Simulate AI typing delay
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));

      const state = stateRef.current;

      // Handle gathering phase — store answer and advance
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
          // All questions answered — propose the DAG
          stateRef.current = "proposed";
          const dag = generateInitialDag(onboardingInput!);
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
            content: `Excellent! I have everything I need. Based on your brand and goals, I've designed a workflow to **${objectiveLabel}**.\n\n**Proposed steps:**\n1. **Lead Sourcing** — Find prospects matching your ICP via Apollo\n2. **Company Research** — Enrich with company data, recent news, tech stack\n3. **Email Personalization** — Generate personalized email with Claude\n4. **Email Delivery** — Send via your email provider\n5. **Response Tracking** — Track opens, clicks, and replies\n\nTake a look at the workflow on the right. Say **"go"** to start the campaign, or tell me what you'd like to change.`,
            timestamp: Date.now(),
          });
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
            "Workflow approved! Starting execution now. Watch the **Results** tab to see prospects being processed in real-time.",
          timestamp: Date.now(),
        });

        const brandDomain = (() => {
          try {
            return new URL(onboardingInput?.brandUrl ?? "").hostname;
          } catch {
            return onboardingInput?.brandUrl ?? "Your Company";
          }
        })();

        cleanupRef.current = startResultsSimulation(
          addResult,
          updateResult,
          brandDomain
        );
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
    ]
  );

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return { sendMessage };
}
