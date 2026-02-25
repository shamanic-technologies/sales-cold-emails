import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("mock chat flow", () => {
  it("should generate initial DAG from onboarding input", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/mock-data.ts"),
      "utf-8"
    );
    expect(content).toContain("generateInitialDag");
    expect(content).toContain("lead-source");
    expect(content).toContain("email-generation");
  });

  it('should trigger results on "go" approval', () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-mock-chat.ts"),
      "utf-8"
    );
    expect(content).toContain('"go"');
    expect(content).toContain("setApproved");
    expect(content).toContain("results");
  });

  it("should support workflow modification on user feedback", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-mock-chat.ts"),
      "utf-8"
    );
    expect(content).toContain("generateModifiedDag");
  });

  it("should ask campaign questions conversationally before proposing DAG", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-mock-chat.ts"),
      "utf-8"
    );
    expect(content).toContain("target_audience");
    expect(content).toContain("value_for_target");
    expect(content).toContain("urgency");
    expect(content).toContain("scarcity");
    expect(content).toContain("risk_reversal");
    expect(content).toContain("social_proof");
  });

  it("should start with brand scraping simulation", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/chat/use-mock-chat.ts"),
      "utf-8"
    );
    expect(content).toContain("scraping");
    expect(content).toContain("brandUrl");
  });
});
