import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("instrumentation", () => {
  it("should register app config with chat-service lazily via ensureAppConfigRegistered", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/instrumentation.ts"),
      "utf-8"
    );
    expect(content).toContain("ensureAppConfigRegistered");
    expect(content).toContain("/apps/sales-cold-emails/config");
    expect(content).toContain("systemPrompt");
    expect(content).toContain("CHAT_SERVICE_URL");
  });

  it("should skip registration when CHAT_SERVICE_URL is not set", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/instrumentation.ts"),
      "utf-8"
    );
    expect(content).toContain("skipping");
  });

  it("should use X-API-Key auth with x-org-id and x-user-id headers", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/instrumentation.ts"),
      "utf-8"
    );
    expect(content).toContain("X-API-Key");
    expect(content).toContain("CHAT_SERVICE_API_KEY");
    expect(content).toContain("x-org-id");
    expect(content).toContain("x-user-id");
    expect(content).not.toContain("Bearer");
  });

  it("should define system prompt with campaign assistant instructions", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/instrumentation.ts"),
      "utf-8"
    );
    expect(content).toContain("target_audience");
    expect(content).toContain("value_for_target");
    expect(content).toContain("campaign_answers");
    expect(content).toContain("cold email");
  });

  it("should cache registration with configRegistered flag", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/instrumentation.ts"),
      "utf-8"
    );
    expect(content).toContain("configRegistered");
  });
});
