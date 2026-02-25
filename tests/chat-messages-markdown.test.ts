import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("chat messages", () => {
  it("should use react-markdown for system messages", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/chat-messages.tsx"),
      "utf-8"
    );
    expect(content).toContain("ReactMarkdown");
    expect(content).toContain('"system"');
  });

  it("should auto-scroll to latest message", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/chat-messages.tsx"),
      "utf-8"
    );
    expect(content).toContain("scrollIntoView");
    expect(content).toContain("bottomRef");
  });

  it("should render suggestion blocks with Use this button", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/chat-messages.tsx"),
      "utf-8"
    );
    expect(content).toContain("msg.suggestion");
    expect(content).toContain("Use this");
    expect(content).toContain("onUseSuggestion");
    expect(content).toContain("Suggested answer");
  });

  it("should only show active suggestion button when no user response follows", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/chat-messages.tsx"),
      "utf-8"
    );
    expect(content).toContain("isSuggestionActive");
    expect(content).toContain('role === "user"');
  });
});
