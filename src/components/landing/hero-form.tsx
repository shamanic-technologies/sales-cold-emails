"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { OnboardingInput } from "@/lib/types";

const OBJECTIVES = [
  { value: "responses" as const, label: "Get Responses", icon: "💬" },
  { value: "clicks" as const, label: "Get Link Clicks", icon: "🔗" },
  { value: "meetings" as const, label: "Book Meetings", icon: "📅" },
];

const BUDGET_TYPES = [
  { value: "one-off" as const, label: "One-off" },
  { value: "daily" as const, label: "Per day" },
  { value: "weekly" as const, label: "Per week" },
  { value: "monthly" as const, label: "Per month" },
];

interface FormData {
  description: string;
  brand: string;
  objective: OnboardingInput["objective"] | null;
  goal: string;
  budgetType: OnboardingInput["budgetType"] | null;
  budgetAmount: string;
}

const STEPS = [
  "description",
  "brand",
  "objective",
  "goal",
  "budget",
] as const;

export function HeroForm() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    description: "",
    brand: "",
    objective: null,
    goal: "",
    budgetType: null,
    budgetAmount: "",
  });

  const { isSignedIn } = useAuth();
  const router = useRouter();
  const setOnboardingInput = useAppStore((s) => s.setOnboardingInput);

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const canAdvance = () => {
    switch (currentStep) {
      case "description":
        return form.description.trim().length > 0;
      case "brand":
        return form.brand.trim().length > 0;
      case "objective":
        return form.objective !== null;
      case "goal":
        return form.goal.trim().length > 0;
      case "budget":
        return form.budgetType !== null && form.budgetAmount.trim().length > 0;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canAdvance()) return;

    if (!isLastStep) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    const input: OnboardingInput = {
      description: form.description,
      brand: form.brand,
      objective: form.objective!,
      goal: form.goal,
      budgetType: form.budgetType!,
      budgetAmount: Number(form.budgetAmount),
      pricingTier: "pay-as-you-go",
    };
    setOnboardingInput(input);

    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      router.push("/sign-up");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 w-full max-w-2xl">
      <div className="relative min-h-[200px] overflow-hidden rounded-2xl bg-white p-8 shadow-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === "description" && (
              <div className="flex flex-col gap-4">
                <label className="text-left text-lg font-semibold text-gray-900">
                  What type of sales cold emails do you want to send?
                </label>
                <input
                  type="text"
                  autoFocus
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="e.g., B2B SaaS outreach to VP Engineering..."
                  className="w-full rounded-xl border border-gray-200 px-5 py-4 text-lg outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            )}

            {currentStep === "brand" && (
              <div className="flex flex-col gap-4">
                <label className="text-left text-lg font-semibold text-gray-900">
                  For which brand or company?
                </label>
                <input
                  type="text"
                  autoFocus
                  value={form.brand}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand: e.target.value }))
                  }
                  placeholder="Your company name or URL"
                  className="w-full rounded-xl border border-gray-200 px-5 py-4 text-lg outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            )}

            {currentStep === "objective" && (
              <div className="flex flex-col gap-4">
                <label className="text-left text-lg font-semibold text-gray-900">
                  What matters most to you?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {OBJECTIVES.map((obj) => (
                    <button
                      key={obj.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, objective: obj.value }))
                      }
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
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "goal" && (
              <div className="flex flex-col gap-4">
                <label className="text-left text-lg font-semibold text-gray-900">
                  What is your specific objective?
                </label>
                <input
                  type="text"
                  autoFocus
                  value={form.goal}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, goal: e.target.value }))
                  }
                  placeholder="e.g., Book 10 demos per week with series A startups"
                  className="w-full rounded-xl border border-gray-200 px-5 py-4 text-lg outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            )}

            {currentStep === "budget" && (
              <div className="flex flex-col gap-4">
                <label className="text-left text-lg font-semibold text-gray-900">
                  What is your budget?
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    autoFocus
                    value={form.budgetAmount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, budgetAmount: e.target.value }))
                    }
                    placeholder="Amount ($)"
                    className="flex-1 rounded-xl border border-gray-200 px-5 py-4 text-lg outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition ${
                  i <= step ? "bg-indigo-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
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
