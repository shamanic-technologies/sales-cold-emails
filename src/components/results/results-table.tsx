"use client";

import { AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { ProgressStats } from "./progress-stats";
import { ResultsRowComponent } from "./results-row";
import { EmailPreviewPanel } from "./email-preview-panel";

export function ResultsTable() {
  const results = useAppStore((s) => s.results);
  const selectedResultId = useAppStore((s) => s.selectedResultId);
  const setSelectedResultId = useAppStore((s) => s.setSelectedResultId);

  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Results will appear here once the campaign starts.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col overflow-hidden">
        <ProgressStats />
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {results.map((row) => (
                  <ResultsRowComponent
                    key={row.id}
                    row={row}
                    onClick={() => setSelectedResultId(row.id)}
                    isSelected={row.id === selectedResultId}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
      <EmailPreviewPanel />
    </div>
  );
}
