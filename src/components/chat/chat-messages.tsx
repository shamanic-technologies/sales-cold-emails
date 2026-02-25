"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { User, ArrowRight } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  onUseSuggestion?: (text: string) => void;
}

export function ChatMessages({ messages, onUseSuggestion }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-400">
        Your conversation will appear here.
      </div>
    );
  }

  // A suggestion is active if no user message follows it
  const isSuggestionActive = (index: number) => {
    for (let i = index + 1; i < messages.length; i++) {
      if (messages[i].role === "user") return false;
    }
    return true;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            <div
              className={`flex gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {msg.role === "system" ? (
                <Image
                  src="/bot-avatar.jpg"
                  alt="Bot"
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 rounded-lg"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <User className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.role === "system" ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-gray-900">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>

            {/* Suggestion block */}
            {msg.suggestion && (
              <div className="ml-11 mt-2">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3">
                  <p className="mb-2 text-xs font-medium text-indigo-500">
                    Suggested answer
                  </p>
                  <p className="text-sm text-gray-700">{msg.suggestion}</p>
                  {isSuggestionActive(idx) && onUseSuggestion && (
                    <button
                      onClick={() => onUseSuggestion(msg.suggestion!)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
                    >
                      Use this
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
