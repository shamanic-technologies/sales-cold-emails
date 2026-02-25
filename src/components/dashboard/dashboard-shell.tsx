"use client";

import { UserButton } from "@clerk/nextjs";
import { Mail } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Mail className="h-4 w-4" />
          </div>
          <span className="font-semibold text-gray-900">
            Sales Cold Emails
          </span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat sidebar */}
        <aside className="flex w-[400px] shrink-0 flex-col border-r border-gray-200 bg-gray-50/50">
          <ChatPanel />
        </aside>

        {/* Right panel */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
