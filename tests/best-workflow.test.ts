import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("best workflow integration", () => {
  const apiClientContent = fs.readFileSync(
    path.join(__dirname, "../src/lib/api-client.ts"),
    "utf-8"
  );
  const useChatContent = fs.readFileSync(
    path.join(__dirname, "../src/components/chat/use-chat.ts"),
    "utf-8"
  );
  const routeContent = fs.readFileSync(
    path.join(__dirname, "../src/app/api/workflows/best/route.ts"),
    "utf-8"
  );
  const typesContent = fs.readFileSync(
    path.join(__dirname, "../src/lib/types.ts"),
    "utf-8"
  );
  const storeContent = fs.readFileSync(
    path.join(__dirname, "../src/lib/store.ts"),
    "utf-8"
  );

  it("should have getBestWorkflow function in api-client", () => {
    expect(apiClientContent).toContain("export async function getBestWorkflow");
    expect(apiClientContent).toContain("/api/workflows/best");
    expect(apiClientContent).toContain('objective: "replies" | "clicks"');
  });

  it("should pass category, channel, audienceType, objective as query params", () => {
    expect(apiClientContent).toContain("category");
    expect(apiClientContent).toContain("channel");
    expect(apiClientContent).toContain("audienceType");
    expect(apiClientContent).toContain("objective");
  });

  it("should have a proxy route for /api/workflows/best without appId filter", () => {
    expect(routeContent).toContain("export async function GET");
    expect(routeContent).toContain("/v1/workflows/best");
    expect(routeContent).not.toContain("appId");
  });

  it("should have mock mode support in the best workflow route", () => {
    expect(routeContent).toContain("isMockMode()");
    expect(routeContent).toContain("mock-best-workflow-id");
    expect(routeContent).toContain("stats");
  });

  it("should have BestWorkflowResponse type with stats", () => {
    expect(typesContent).toContain("export interface BestWorkflowResponse");
    expect(typesContent).toContain("export interface BestWorkflowStats");
    expect(typesContent).toContain("costPerOutcome");
    expect(typesContent).toContain("completedRuns");
  });

  it("should call getBestWorkflow at init instead of generateWorkflow", () => {
    // getBestWorkflow should be called first
    expect(useChatContent).toContain("getBestWorkflow(apiObjective)");
    // Map "responses" → "replies" for the API
    expect(useChatContent).toContain(
      'onboardingInput.objective === "responses" ? "replies" : "clicks"'
    );
  });

  it("should fall back to generateWorkflow when best workflow is not available", () => {
    // Should catch error from getBestWorkflow and fall back
    expect(useChatContent).toContain("falling back to generate");
    expect(useChatContent).toContain("generateWorkflow(description)");
  });

  it("should store workflow response that accepts both types", () => {
    expect(storeContent).toContain("BestWorkflowResponse");
    expect(storeContent).toContain("WorkflowResponseData");
  });
});
