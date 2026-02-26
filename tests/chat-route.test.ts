import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("chat route handler", () => {
  it("should have POST handler that proxies to chat-service", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/chat/route.ts"),
      "utf-8"
    );
    expect(content).toContain("POST");
    expect(content).toContain("CHAT_SERVICE_URL");
    expect(content).toContain("/chat");
    expect(content).toContain("text/event-stream");
  });

  it("should send org and user identity headers", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/chat/route.ts"),
      "utf-8"
    );
    expect(content).toContain("x-org-id");
    expect(content).toContain("x-user-id");
    expect(content).toContain("getOrgId");
    expect(content).toContain("getUserId");
  });

  it("should support mock mode when CHAT_SERVICE_URL is not set", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/chat/route.ts"),
      "utf-8"
    );
    expect(content).toContain("isChatMockMode");
    expect(content).toContain("mockChatResponse");
    expect(content).toContain("ReadableStream");
  });

  it("should use X-API-Key auth for chat-service", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/chat/route.ts"),
      "utf-8"
    );
    expect(content).toContain("X-API-Key");
    expect(content).toContain("CHAT_SERVICE_API_KEY");
    expect(content).not.toContain("Bearer");
  });

  it("should send appId as sales-cold-emails", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/chat/route.ts"),
      "utf-8"
    );
    expect(content).toContain('"sales-cold-emails"');
  });
});
