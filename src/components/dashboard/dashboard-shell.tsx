"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { MessageSquare, BarChart3 } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CreditsBadge } from "@/components/billing/credits-badge";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSubpage = pathname !== "/dashboard";
  const [mobileTab, setMobileTab] = useState<"chat" | "results">("chat");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="Sales Cold Emails" width={32} height={32} className="h-8 w-8 rounded-lg" />
          <span className="hidden font-semibold text-gray-900 sm:inline">
            Sales Cold Emails
          </span>
        </div>

        {/* Mobile tab toggle — only on main dashboard */}
        {!isSubpage && (
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 md:hidden">
            <button
              onClick={() => setMobileTab("chat")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mobileTab === "chat"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </button>
            <button
              onClick={() => setMobileTab("results")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mobileTab === "results"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Results
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <CreditsBadge />
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main content — desktop: side-by-side, mobile: tab toggle */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat sidebar — hidden on subpages mobile, full width on mobile when active, fixed width on desktop */}
        <aside
          className={`flex shrink-0 flex-col border-r border-gray-200 bg-gray-50/50 ${
            isSubpage ? "hidden" : mobileTab === "chat" ? "w-full" : "hidden"
          } md:flex md:w-[400px]`}
        >
          <ChatPanel />
        </aside>

        {/* Right panel — always visible on subpages, tab-controlled on main dashboard */}
        <main
          className={`flex-1 overflow-hidden ${
            isSubpage ? "block" : mobileTab === "results" ? "block" : "hidden"
          } md:block`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
