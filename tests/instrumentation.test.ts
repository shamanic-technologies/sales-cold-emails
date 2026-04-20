import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const content = fs.readFileSync(
  path.join(__dirname, "../src/instrumentation.ts"),
  "utf-8"
);

describe("instrumentation", () => {
  describe("chat config", () => {
    it("should register app config lazily via ensureAppConfigRegistered", () => {
      expect(content).toContain("ensureAppConfigRegistered");
      expect(content).toContain("/v1/chat/config");
      expect(content).toContain("systemPrompt");
    });

    it("should use Bearer auth with MCPF_APP_KEY for chat config", () => {
      expect(content).toContain("Authorization");
      expect(content).toContain("Bearer");
      expect(content).toContain("MCPF_APP_KEY");
    });

    it("should forward Clerk IDs as x-org-id and x-user-id headers", () => {
      expect(content).toContain("clerkIds");
      expect(content).toContain('"x-org-id"');
      expect(content).toContain('"x-user-id"');
    });

    it("should cache registration with configRegistered flag", () => {
      expect(content).toContain("configRegistered");
    });

    it("should define system prompt with campaign assistant instructions", () => {
      expect(content).toContain("target_audience");
      expect(content).toContain("value_for_target");
      expect(content).toContain("campaign_answers");
      expect(content).toContain("cold email");
    });
  });

  describe("api-service key registration", () => {
    it("should register platform keys via POST /v1/platform-keys on api-service", () => {
      expect(content).toContain("/v1/platform-keys");
      expect(content).toContain("registerPlatformKey");
      expect(content).toContain("registerPlatformKeys");
    });

    it("should register gemini, stripe, and stripe-webhook providers", () => {
      expect(content).toContain('"gemini"');
      expect(content).toContain('"stripe"');
      expect(content).toContain('"stripe-webhook"');
    });

    it("should read Stripe key from STRIPE_SECRET_KEY env var", () => {
      expect(content).toContain("process.env.STRIPE_SECRET_KEY");
    });

    it("should use MCPF_APP_KEY for Bearer auth, not KEY_SERVICE", () => {
      expect(content).toContain("MCPF_APP_KEY");
      expect(content).toContain("Bearer");
      expect(content).not.toContain("KEY_SERVICE_URL");
      expect(content).not.toContain("KEY_SERVICE_API_KEY");
    });

    it("should not use appId or scope: app (removed in breaking change)", () => {
      expect(content).not.toContain("APP_ID");
      expect(content).not.toContain('scope: "app"');
      expect(content).not.toContain("appId");
    });
  });

  describe("startup", () => {
    it("should use Promise.allSettled for parallel registration", () => {
      expect(content).toContain("Promise.allSettled");
    });

    it("should register platform keys in register()", () => {
      expect(content).toContain("registerPlatformKeys()");
    });

    it("should not reference transactional-email-service (migrated to Postmark)", () => {
      expect(content).not.toContain("TRANSACTIONAL_EMAIL_SERVICE");
      expect(content).not.toContain("registerEmailTemplates");
    });

    it("should skip non-nodejs runtime", () => {
      expect(content).toContain('NEXT_RUNTIME !== "nodejs"');
    });
  });
});
