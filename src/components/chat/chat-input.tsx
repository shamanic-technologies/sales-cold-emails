"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={disabled ? "AI is thinking..." : "Type a message..."}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white transition hover:bg-orange-700 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
