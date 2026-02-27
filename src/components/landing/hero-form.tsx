"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Globe, Link2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { saveSetup } from "@/lib/api-client";
import type { OnboardingInput } from "@/lib/types";

const OBJECTIVES = [
  { value: "responses" as const, label: "Get Responses", icon: "💬", description: "Maximize email replies" },
  { value: "clicks" as const, label: "Get Link Clicks", icon: "🔗", description: "Drive traffic to a URL" },
];

const BUDGET_TYPES = [
  { value: "one-off" as const, label: "One-off" },
  { value: "daily" as const, label: "Per day" },
  { value: "weekly" as const, label: "Per week" },
  { value: "monthly" as const, label: "Per month" },
];

interface FormData {
  brandUrl: string;
  objective: OnboardingInput["objective"] | null;
  objectiveUrl: string;
  budgetType: OnboardingInput["budgetType"] | null;
  budgetAmount: string;
}

type Step = "brand-url" | "objective" | "objective-url" | "budget";

export function HeroForm() {
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    brandUrl: "",
    objective: null,
    objectiveUrl: "",
    budgetType: null,
    budgetAmount: "",
  });

  const { isSignedIn } = useAuth();
  const router = useRouter();
  const setOnboardingInput = useAppStore((s) => s.setOnboardingInput);

  // Dynamic steps — objective-url only appears for clicks
  const steps: Step[] = (() => {
    const base: Step[] = ["brand-url", "objective"];
    if (form.objective === "clicks") {
      base.push("objective-url");
    }
    base.push("budget");
    return base;
  })();

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const canAdvance = () => {
    switch (currentStep) {
      case "brand-url":
        return form.brandUrl.trim().length > 0;
      case "objective":
        return form.objective !== null;
      case "objective-url":
        return form.objectiveUrl.trim().length > 0;
      case "budget":
        return form.budgetType !== null && form.budgetAmount.trim().length > 0;
    }
  };

  const handleObjectiveSelect = (value: OnboardingInput["objective"]) => {
    setForm((f) => ({
      ...f,
      objective: value,
      objectiveUrl: value === "clicks" ? f.brandUrl : "",
    }));
  };

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canAdvance()) return;

    if (!isLastStep) {
      setStepIndex((s) => s + 1);
      return;
    }

    setSubmitting(true);
    const input: OnboardingInput = {
      brandUrl: normalizeUrl(form.brandUrl),
      objective: form.objective!,
      objectiveUrl: form.objective !== "responses" ? normalizeUrl(form.objectiveUrl) : undefined,
      budgetType: form.budgetType!,
      budgetAmount: Number(form.budgetAmount),
      pricingTier: "pay-as-you-go",
    };
    setOnboardingInput(input);
    saveSetup({
      brandUrl: input.brandUrl,
      objective: input.objective,
      objectiveUrl: input.objectiveUrl ?? null,
      budgetType: input.budgetType,
      budgetAmount: input.budgetAmount,
      pricingTier: input.pricingTier,
    });

    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      router.push("/sign-up");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 w-full max-w-2xl sm:mt-10">
      <div className="relative min-h-[200px] overflow-hidden rounded-2xl bg-white p-4 shadow-xl sm:p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === "brand-url" && (
              <div className="flex flex-col gap-4">
                <label className="text-left text-base font-semibold text-gray-900 sm:text-lg">
                  What is your brand&apos;s website?
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    value={form.brandUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brandUrl: e.target.value }))
                    }
                    placeholder="yourcompany.com"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:py-4 sm:text-lg"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  We&apos;ll analyze your website to understand your brand and offering.
                </p>
              </div>
            )}

            {currentStep === "objective" && (
              <div className="flex flex-col gap-4">
                <label className="text-left text-base font-semibold text-gray-900 sm:text-lg">
                  What do you want to achieve?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {OBJECTIVES.map((obj) => (
                    <button
                      key={obj.value}
                      type="button"
                      onClick={() => handleObjectiveSelect(obj.value)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                        form.objective === obj.value
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl">{obj.icon}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {obj.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {obj.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "objective-url" && (
              <div className="flex flex-col gap-4">
                <label className="text-left text-base font-semibold text-gray-900 sm:text-lg">
                  Which URL should recipients click?
                </label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    value={form.objectiveUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, objectiveUrl: e.target.value }))
                    }
                    placeholder="yourcompany.com/landing-page"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:py-4 sm:text-lg"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Pre-filled with your brand URL. You can also use a Calendly link here.
                </p>
              </div>
            )}

            {currentStep === "budget" && (
              <div className="flex flex-col gap-4">
                <label className="text-left text-base font-semibold text-gray-900 sm:text-lg">
                  What is your budget?
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    autoFocus
                    value={form.budgetAmount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, budgetAmount: e.target.value }))
                    }
                    placeholder="Amount ($)"
                    className="w-full rounded-xl border border-gray-200 px-5 py-4 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:flex-1 sm:text-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {BUDGET_TYPES.map((bt) => (
                      <button
                        key={bt.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, budgetType: bt.value }))
                        }
                        className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                          form.budgetType === bt.value
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots + navigation */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition ${
                  i <= stepIndex ? "bg-indigo-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => setStepIndex((s) => s - 1)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={!canAdvance() || submitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLastStep ? (
                "Get Started"
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
