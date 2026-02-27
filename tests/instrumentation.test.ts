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
    it("should register secrets via POST /v1/keys on api-service", () => {
      expect(content).toContain("/v1/keys");
      expect(content).toContain("registerAppKey");
      expect(content).toContain("registerAppSecrets");
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

    it("should send scope: app for key registration", () => {
      expect(content).toContain('scope: "app"');
    });

    it("should send appId as sales-cold-emails", () => {
      expect(content).toContain('appId: APP_ID');
      expect(content).toContain('"sales-cold-emails"');
    });
  });

  describe("transactional email templates", () => {
    it("should register templates via PUT /templates", () => {
      expect(content).toContain("registerEmailTemplates");
      expect(content).toContain('method: "PUT"');
      expect(content).toContain("/templates");
    });

    it("should use TRANSACTIONAL_EMAIL_SERVICE_URL and API_KEY", () => {
      expect(content).toContain("TRANSACTIONAL_EMAIL_SERVICE_URL");
      expect(content).toContain("TRANSACTIONAL_EMAIL_SERVICE_API_KEY");
    });

    it("should define welcome, campaign_launched, campaign_completed, and low_credits templates", () => {
      expect(content).toContain('"welcome"');
      expect(content).toContain('"campaign_launched"');
      expect(content).toContain('"campaign_completed"');
      expect(content).toContain('"low_credits"');
    });

    it("should include both htmlBody and textBody for each template", () => {
      const htmlCount = (content.match(/htmlBody/g) || []).length;
      const textCount = (content.match(/textBody/g) || []).length;
      expect(htmlCount).toBeGreaterThanOrEqual(4);
      expect(textCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe("startup", () => {
    it("should use Promise.allSettled for parallel registration", () => {
      expect(content).toContain("Promise.allSettled");
    });

    it("should register secrets and templates in register()", () => {
      expect(content).toContain("registerAppSecrets()");
      expect(content).toContain("registerEmailTemplates()");
    });

    it("should skip non-nodejs runtime", () => {
      expect(content).toContain('NEXT_RUNTIME !== "nodejs"');
    });
  });
});
