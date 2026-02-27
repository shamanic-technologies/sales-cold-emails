"use client";

import { useAppStore } from "@/lib/store";
import type { CampaignStatus, OnboardingInput } from "@/lib/types";

function formatCurrency(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "—";
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function StatusPill({ status }: { status: CampaignStatus }) {
  const styles: Record<CampaignStatus, string> = {
    ready: "bg-emerald-100 text-emerald-700",
    launching: "bg-amber-100 text-amber-700",
    running: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
  };
  const labels: Record<CampaignStatus, string> = {
    ready: "Ready",
    launching: "Launching...",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status === "launching" && (
        <span className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {labels[status]}
    </span>
  );
}

const BUDGET_TYPE_OPTIONS: { value: OnboardingInput["budgetType"]; label: string }[] = [
  { value: "one-off", label: "One-off" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function WorkflowPicker() {
  const workflowResponse = useAppStore((s) => s.workflowResponse);
  const workflowError = useAppStore((s) => s.workflowError);
  const campaignStats = useAppStore((s) => s.campaignStats);
  const campaignStatus = useAppStore((s) => s.campaignStatus);
  const onboardingInput = useAppStore((s) => s.onboardingInput);
  const setOnboardingBudget = useAppStore((s) => s.setOnboardingBudget);
  const launchCampaignFromPicker = useAppStore((s) => s.launchCampaignFromPicker);

  if (!workflowResponse) {
    if (workflowError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-gray-400">
          <div className="text-2xl">&#9888;</div>
          {workflowError}
        </div>
      );
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-gray-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
        Loading workflows...
      </div>
    );
  }

  // Compute stats from campaignStats (live SSE data)
  const sent = campaignStats?.emailsSent ?? 0;
  const opened = campaignStats?.emailsOpened ?? 0;
  const clicked = campaignStats?.emailsClicked ?? 0;
  const replied = campaignStats?.emailsReplied ?? 0;
  const cost = campaignStats?.totalCostUsd ?? 0;

  const pctOpens = sent > 0 ? (opened / sent) * 100 : null;
  const pctClicks = sent > 0 ? (clicked / sent) * 100 : null;
  const pctReplies = sent > 0 ? (replied / sent) * 100 : null;
  const costPerOpen = opened > 0 ? cost / opened : null;
  const costPerClick = clicked > 0 ? cost / clicked : null;
  const costPerReply = replied > 0 ? cost / replied : null;

  const workflowName = workflowResponse.workflow.signatureName ?? workflowResponse.workflow.name;
  const canLaunch = campaignStatus === "ready" || campaignStatus === "failed";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Available Workflows</h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-600">Workflow</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-600">% Opens</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-600">% Clicks</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-600">% Replies</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-600">$/Open</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-600">$/Click</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-600">$/Reply</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900">{workflowName}</td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700">{formatPercent(pctOpens)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700">{formatPercent(pctClicks)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700">{formatPercent(pctReplies)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700">{formatCurrency(costPerOpen)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700">{formatCurrency(costPerClick)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700">{formatCurrency(costPerReply)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Budget + Status + Launch */}
        <div className="mt-4 flex flex-wrap items-end gap-4">
          {/* Budget type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Budget type</label>
            <select
              value={onboardingInput?.budgetType ?? "one-off"}
              onChange={(e) =>
                setOnboardingBudget(
                  e.target.value as OnboardingInput["budgetType"],
                  onboardingInput?.budgetAmount ?? 0
                )
              }
              disabled={!canLaunch}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 disabled:opacity-50"
            >
              {BUDGET_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Budget amount */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Amount ($)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={onboardingInput?.budgetAmount ?? 0}
              onChange={(e) =>
                setOnboardingBudget(
                  onboardingInput?.budgetType ?? "one-off",
                  Number(e.target.value) || 0
                )
              }
              disabled={!canLaunch}
              className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 disabled:opacity-50"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <StatusPill status={campaignStatus} />
          </div>

          {/* Launch button */}
          <button
            onClick={() => launchCampaignFromPicker()}
            disabled={!canLaunch}
            className="rounded-lg bg-orange-600 px-5 py-1.5 text-sm font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Launch
          </button>
        </div>
      </div>
    </div>
  );
}
