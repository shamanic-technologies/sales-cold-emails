"use client";

import { X, Mail } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function EmailPreviewPanel() {
  const results = useAppStore((s) => s.results);
  const selectedResultId = useAppStore((s) => s.selectedResultId);
  const setSelectedResultId = useAppStore((s) => s.setSelectedResultId);

  const selected = results.find((r) => r.id === selectedResultId);

  if (!selected || !selected.emailSubject) return null;

  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium text-gray-900">
            Email Preview
          </span>
        </div>
        <button
          onClick={() => setSelectedResultId(null)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Email header */}
        <div className="space-y-2 rounded-lg bg-gray-50 p-4">
          <div className="flex gap-2 text-sm">
            <span className="font-medium text-gray-500">To:</span>
            <span className="text-gray-900">
              {selected.personName} &lt;{selected.email}&gt;
            </span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="font-medium text-gray-500">Subject:</span>
            <span className="text-gray-900">{selected.emailSubject}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="font-medium text-gray-500">Status:</span>
            <span className="text-gray-900 capitalize">{selected.status}</span>
          </div>
        </div>

        {/* Email body */}
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-gray-700">
          {selected.emailBody?.split("\n").map((line, i) => (
            <p key={i}>{line || "\u00A0"}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
