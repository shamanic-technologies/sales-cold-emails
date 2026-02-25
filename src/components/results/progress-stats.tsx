"use client";

import { useAppStore } from "@/lib/store";
import { Mail, Eye, MessageSquare, Users } from "lucide-react";

export function ProgressStats() {
  const results = useAppStore((s) => s.results);
  const campaignStats = useAppStore((s) => s.campaignStats);

  // Prefer API stats when available, fall back to client-side counting
  const total = campaignStats?.leadsServed ?? results.length;
  const sent =
    campaignStats?.emailsSent ??
    results.filter((r) => ["sent", "opened", "replied"].includes(r.status))
      .length;
  const opened =
    campaignStats?.emailsOpened ??
    results.filter((r) => ["opened", "replied"].includes(r.status)).length;
  const replied =
    campaignStats?.emailsReplied ??
    results.filter((r) => r.status === "replied").length;

  const stats = [
    {
      label: "Total Leads",
      value: total,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Emails Sent",
      value: sent,
      icon: Mail,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Opened",
      value: opened,
      icon: Eye,
      color: "bg-amber-100 text-amber-600",
    },
    {
      label: "Replied",
      value: replied,
      icon: MessageSquare,
      color: "bg-indigo-100 text-indigo-600",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 border-b border-gray-200 bg-gray-50 p-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}
          >
            <stat.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
