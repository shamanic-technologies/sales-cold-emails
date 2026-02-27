"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Search, Building2, Sparkles, Mail, BarChart3 } from "lucide-react";
import type { DagNodeType } from "@/lib/types";

const ICONS: Record<DagNodeType, typeof Search> = {
  "lead-source": Search,
  enrichment: Building2,
  "email-generation": Sparkles,
  sending: Mail,
  tracking: BarChart3,
};

const STATUS_STYLES: Record<string, string> = {
  pending: "border-gray-200 bg-white",
  active: "border-orange-400 bg-orange-50 shadow-md shadow-orange-100",
  completed: "border-emerald-400 bg-emerald-50",
  error: "border-red-400 bg-red-50",
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-600" },
  active: { label: "Active", color: "bg-orange-100 text-orange-700" },
  completed: { label: "Done", color: "bg-emerald-100 text-emerald-700" },
  error: { label: "Error", color: "bg-red-100 text-red-700" },
};

interface DagStepData {
  label: string;
  description: string;
  nodeType: DagNodeType;
  status: string;
}

function DagStepNodeComponent({ data }: NodeProps<DagStepData>) {
  const Icon = ICONS[data.nodeType] ?? Mail;
  const badge = STATUS_BADGES[data.status] ?? STATUS_BADGES.pending;

  return (
    <div
      className={`min-w-[220px] rounded-xl border-2 p-4 transition ${
        STATUS_STYLES[data.status] ?? STATUS_STYLES.pending
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-300" />

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {data.label}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">{data.description}</p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-300"
      />
    </div>
  );
}

export const DagStepNode = memo(DagStepNodeComponent);
