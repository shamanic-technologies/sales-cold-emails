"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import {
  generateInitialDag,
  generateModifiedDag,
  startResultsSimulation,
} from "@/lib/mock-data";

type ConversationState = "initial" | "proposed" | "approved" | "running";

export function useMockChat() {
  const stateRef = useRef<ConversationState>("initial");
  const cleanupRef = useRef<(() => void) | null>(null);
  const initRef = useRef(false);

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

    const dag = generateInitialDag(onboardingInput);
    setDag(dag);

    addMessage({
      id: crypto.randomUUID(),
      role: "system",
      content: `Based on your input, I've designed a workflow for **${onboardingInput.brand}** to ${onboardingInput.goal}.\n\n**Proposed steps:**\n1. **Lead Sourcing** — Find prospects matching your ICP via Apollo\n2. **Company Research** — Enrich with company data, recent news, tech stack\n3. **Email Personalization** — Generate personalized email with Claude\n4. **Email Delivery** — Send via your email provider\n5. **Response Tracking** — Track opens, clicks, and replies\n\nTake a look at the workflow on the right. Say **"go"** to start the campaign, or tell me what you'd like to change.`,
      timestamp: Date.now(),
    });

    stateRef.current = "proposed";
  }, [onboardingInput, messages.length, addMessage, setDag]);

  const sendMessage = useCallback(
    async (content: string) => {
      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      });

      // Simulate AI typing delay
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

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

      if (stateRef.current === "proposed" && isApproval) {
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

        const brand = onboardingInput?.brand ?? "Your Company";
        cleanupRef.current = startResultsSimulation(
          addResult,
          updateResult,
          brand
        );
      } else if (stateRef.current === "running") {
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          content:
            "The campaign is currently running. Check the **Results** tab to see live progress.",
          timestamp: Date.now(),
        });
      } else {
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
