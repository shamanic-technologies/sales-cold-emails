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
});
