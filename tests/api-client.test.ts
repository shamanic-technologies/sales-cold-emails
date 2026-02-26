import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("API client", () => {
  it("should call same-origin /api/ routes, not external URLs", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-client.ts"),
      "utf-8"
    );
    expect(content).toContain('"/api/workflows/generate"');
    expect(content).toContain('"/api/campaigns"');
    expect(content).not.toContain("mcpfactory.org");
  });

  it("should use EventSource for SSE streaming", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-client.ts"),
      "utf-8"
    );
    expect(content).toContain("EventSource");
    expect(content).toContain("/api/campaigns/");
    expect(content).toContain("/stream");
  });

  it("should export typed functions for all endpoints", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-client.ts"),
      "utf-8"
    );
    expect(content).toContain("generateWorkflow");
    expect(content).toContain("createCampaign");
    expect(content).toContain("getCampaignStats");
    expect(content).toContain("connectCampaignStream");
    expect(content).toContain("scrapeBrand");
  });

  it("should call /api/brand/scrape for brand suggestions", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-client.ts"),
      "utf-8"
    );
    expect(content).toContain('"/api/brand/scrape"');
    expect(content).toContain("BrandSuggestions");
  });

  it("should have sendChatMessage that calls /api/chat", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-client.ts"),
      "utf-8"
    );
    expect(content).toContain("sendChatMessage");
    expect(content).toContain('"/api/chat"');
    expect(content).toContain("ChatRequest");
  });
});
