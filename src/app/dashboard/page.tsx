"use client";

import { useAppStore } from "@/lib/store";
import { WorkflowDag } from "@/components/dag/workflow-dag";
import { ResultsTable } from "@/components/results/results-table";
import { GitBranch, Table2 } from "lucide-react";

export default function DashboardPage() {
  const dashboardView = useAppStore((s) => s.dashboardView);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const isApproved = useAppStore((s) => s.isApproved);

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 px-4">
        <button
          onClick={() => setDashboardView("dag")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            dashboardView === "dag"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <GitBranch className="h-4 w-4" />
          Workflow
        </button>
        <button
          onClick={() => isApproved && setDashboardView("results")}
          disabled={!isApproved}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            dashboardView === "results"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <Table2 className="h-4 w-4" />
          Results
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {dashboardView === "dag" ? <WorkflowDag /> : <ResultsTable />}
      </div>
    </div>
  );
}
