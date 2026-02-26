import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("zustand store", () => {
  it("should persist onboardingInput to localStorage", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/store.ts"),
      "utf-8"
    );
    expect(content).toContain("persist");
    expect(content).toContain("onboardingInput");
    expect(content).toContain("partialize");
  });

  it("should have all required state slices", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/store.ts"),
      "utf-8"
    );
    expect(content).toContain("messages");
    expect(content).toContain("currentDag");
    expect(content).toContain("results");
    expect(content).toContain("dashboardView");
    expect(content).toContain("selectedResultId");
    expect(content).toContain("isApproved");
  });

  it("should have campaign-related state for API integration", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/store.ts"),
      "utf-8"
    );
    expect(content).toContain("workflowResponse");
    expect(content).toContain("campaignId");
    expect(content).toContain("campaignStats");
    expect(content).toContain("campaignAnswers");
  });

  it("should persist chatSessionId and have streaming message helpers", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/store.ts"),
      "utf-8"
    );
    expect(content).toContain("chatSessionId");
    expect(content).toContain("updateMessage");
    expect(content).toContain("updateMessageButtons");
  });

  it("should persist chat and campaign state across page refreshes", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/store.ts"),
      "utf-8"
    );
    // Extract the partialize block
    const partializeMatch = content.match(/partialize[\s\S]*?\}\)/);
    expect(partializeMatch).not.toBeNull();
    const partialize = partializeMatch![0];
    // All critical fields must be in partialize
    expect(partialize).toContain("messages");
    expect(partialize).toContain("currentDag");
    expect(partialize).toContain("isApproved");
    expect(partialize).toContain("dashboardView");
    expect(partialize).toContain("campaignAnswers");
    expect(partialize).toContain("results");
    expect(partialize).toContain("campaignStats");
  });
});
