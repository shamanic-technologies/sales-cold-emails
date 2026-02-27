import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("chat route handler", () => {
  it("should have POST handler that proxies to api-service /v1/chat", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/chat/route.ts"),
      "utf-8"
    );
    expect(content).toContain("POST");
    expect(content).toContain("proxyToApi");
    expect(content).toContain("/v1/chat");
    expect(content).toContain("text/event-stream");
  });

  it("should use unified api-proxy, not direct chat-service", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/chat/route.ts"),
      "utf-8"
    );
    expect(content).toContain("@/lib/api-proxy");
    expect(content).not.toContain("CHAT_SERVICE_URL");
    expect(content).not.toContain("CHAT_SERVICE_API_KEY");
    expect(content).not.toContain("X-API-Key");
    expect(content).not.toContain("getOrgId");
    expect(content).not.toContain("getUserId");
  });

  it("should support mock mode via isMockMode", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/chat/route.ts"),
      "utf-8"
    );
    expect(content).toContain("isMockMode");
    expect(content).toContain("mockChatResponse");
    expect(content).toContain("ReadableStream");
  });

  it("should send appId as sales-cold-emails", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/chat/route.ts"),
      "utf-8"
    );
    expect(content).toContain('"sales-cold-emails"');
  });

  it("should lazily register app config with Clerk IDs", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/chat/route.ts"),
      "utf-8"
    );
    expect(content).toContain("ensureAppConfigRegistered");
    expect(content).toContain("getClerkIds");
    expect(content).toContain("@/instrumentation");
  });
});
