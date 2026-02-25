"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useChat } from "./use-chat";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

export function ChatPanel() {
  const messages = useAppStore((s) => s.messages);
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage } = useChat();

  const handleSend = async (content: string) => {
    setIsTyping(true);
    await sendMessage(content);
    setIsTyping(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-sm font-medium text-gray-700">
          Campaign Assistant
        </span>
      </div>
      <ChatMessages messages={messages} />
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
