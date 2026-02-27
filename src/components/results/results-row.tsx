"use client";

import { motion } from "framer-motion";
import { Building2, User, Mail } from "lucide-react";
import type { ResultRow, ResultStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ResultStatus,
  { label: string; color: string }
> = {
  queued: { label: "Queued", color: "bg-gray-100 text-gray-600" },
  researching: {
    label: "Researching",
    color: "bg-blue-100 text-blue-700",
  },
  generating: {
    label: "Generating",
    color: "bg-purple-100 text-purple-700",
  },
  sending: { label: "Sending", color: "bg-yellow-100 text-yellow-700" },
  sent: { label: "Sent", color: "bg-emerald-100 text-emerald-700" },
  opened: { label: "Opened", color: "bg-amber-100 text-amber-700" },
  replied: { label: "Replied", color: "bg-orange-100 text-orange-700" },
};

interface ResultsRowProps {
  row: ResultRow;
  onClick: () => void;
  isSelected: boolean;
}

export function ResultsRowComponent({
  row,
  onClick,
  isSelected,
}: ResultsRowProps) {
  const status = STATUS_CONFIG[row.status];

  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`cursor-pointer border-b border-gray-100 transition hover:bg-gray-50 ${
        isSelected ? "bg-orange-50" : ""
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {row.companyName}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-900">{row.personName}</p>
            <p className="text-xs text-gray-500">{row.personTitle}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm text-gray-600">{row.email}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}
        >
          {status.label}
        </span>
      </td>
    </motion.tr>
  );
}
