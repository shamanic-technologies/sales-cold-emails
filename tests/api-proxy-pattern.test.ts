import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("API proxy pattern", () => {
  it("should check API_SERVICE_URL and MCPF_APP_KEY for mock mode", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain("API_SERVICE_URL");
    expect(content).toContain("MCPF_APP_KEY");
    expect(content).toContain("isMockMode");
  });

  it("should use Clerk auth() for identity, not cookies", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain("@clerk/nextjs/server");
    expect(content).toContain("auth()");
    expect(content).not.toContain("mcpf_api_key");
    expect(content).not.toContain("cookies");
  });

  it("should use Bearer token auth with MCPF_APP_KEY", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain("Bearer");
    expect(content).toContain("Authorization");
    expect(content).not.toContain("X-API-Key");
  });

  it("should have proxyToApi and proxySSE functions", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain("proxyToApi");
    expect(content).toContain("proxySSE");
  });

  it("should expose getClerkIds helper instead of cookie-based helpers", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain("getClerkIds");
    expect(content).not.toContain("getOrgId");
    expect(content).not.toContain("getUserId");
    expect(content).not.toContain("mcpf_org_id");
    expect(content).not.toContain("mcpf_user_id");
  });

  it("should send x-org-id and x-user-id headers from Clerk session", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain('"x-org-id"');
    expect(content).toContain('"x-user-id"');
    expect(content).toContain("orgId");
    expect(content).toContain("userId");
  });
});

describe("No provision route", () => {
  it("should not have auth/provision route (unified auth removed it)", () => {
    const provisionPath = path.join(
      __dirname,
      "../src/app/api/auth/provision/route.ts"
    );
    expect(fs.existsSync(provisionPath)).toBe(false);
  });
});
