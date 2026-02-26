import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const routeSrc = readFileSync(
  join(__dirname, "../src/app/api/webhooks/clerk/route.ts"),
  "utf-8"
);

const middlewareSrc = readFileSync(
  join(__dirname, "../src/middleware.ts"),
  "utf-8"
);

describe("Clerk webhook route", () => {
  it("should verify svix signature", () => {
    expect(routeSrc).toContain('new Webhook(CLERK_WEBHOOK_SECRET)');
    expect(routeSrc).toContain("wh.verify(body");
    expect(routeSrc).toContain("svix-id");
    expect(routeSrc).toContain("svix-timestamp");
    expect(routeSrc).toContain("svix-signature");
  });

  it("should handle user.created event", () => {
    expect(routeSrc).toContain('"user.created"');
  });

  it("should send welcome email via transactional-email-service", () => {
    expect(routeSrc).toContain("/send");
    expect(routeSrc).toContain('"welcome"');
    expect(routeSrc).toContain("eventType");
    expect(routeSrc).toContain("recipientEmail");
  });

  it("should pass firstName and dashboardUrl as metadata", () => {
    expect(routeSrc).toContain("firstName");
    expect(routeSrc).toContain("dashboardUrl");
    expect(routeSrc).toContain("metadata");
  });

  it("should use x-api-key auth for transactional-email-service", () => {
    expect(routeSrc).toContain('"x-api-key"');
    expect(routeSrc).toContain("TRANSACTIONAL_EMAIL_SERVICE_API_KEY");
  });

  it("should return 400 for missing svix headers", () => {
    expect(routeSrc).toContain("Missing svix headers");
    expect(routeSrc).toContain("400");
  });

  it("should return 401 for invalid signature", () => {
    expect(routeSrc).toContain("Invalid signature");
    expect(routeSrc).toContain("401");
  });

  it("should use CLERK_WEBHOOK_SECRET env var", () => {
    expect(routeSrc).toContain("CLERK_WEBHOOK_SECRET");
  });
});

describe("Middleware webhook access", () => {
  it("should allow /api/webhooks as public route", () => {
    expect(middlewareSrc).toContain("/api/webhooks(.*)");
  });
});
