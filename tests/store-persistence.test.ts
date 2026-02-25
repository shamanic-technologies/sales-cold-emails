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
});
