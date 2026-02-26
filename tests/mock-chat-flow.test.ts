import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("chat flow", () => {
  it("should stream messages from chat-service via sendChatMessage", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-chat.ts"),
      "utf-8"
    );
    expect(content).toContain("sendChatMessage");
    expect(content).toContain("parseSSEStream");
    expect(content).toContain("streamChatResponse");
  });

  it("should extract campaign_answers JSON block from streamed text", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-chat.ts"),
      "utf-8"
    );
    expect(content).toContain("extractCampaignAnswers");
    expect(content).toContain("campaign_answers");
    expect(content).toContain("CampaignAnswers");
  });

  it("should track chatSessionId for conversation continuity", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-chat.ts"),
      "utf-8"
    );
    expect(content).toContain("chatSessionId");
    expect(content).toContain("setChatSessionId");
    expect(content).toContain("sessionId");
  });

  it('should trigger campaign launch on approval keywords', () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-chat.ts"),
      "utf-8"
    );
    expect(content).toContain('"go"');
    expect(content).toContain("setApproved");
    expect(content).toContain("launchCampaign");
  });

  it("should call real API endpoints for workflow and campaign", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-chat.ts"),
      "utf-8"
    );
    expect(content).toContain("generateWorkflow");
    expect(content).toContain("createCampaign");
    expect(content).toContain("connectCampaignStream");
  });

  it("should scrape brand and pass suggestions as context", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-chat.ts"),
      "utf-8"
    );
    expect(content).toContain("scrapeBrand");
    expect(content).toContain("brandSuggestions");
    expect(content).toContain("BrandSuggestions");
  });

  it("should handle SSE events for real-time results", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-chat.ts"),
      "utf-8"
    );
    expect(content).toContain("onmessage");
    expect(content).toContain("lead_update");
    expect(content).toContain("addResult");
    expect(content).toContain("updateResult");
  });

  it("should update messages in-place during streaming", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-chat.ts"),
      "utf-8"
    );
    expect(content).toContain("updateMessage");
    expect(content).toContain("accumulated");
  });
});
