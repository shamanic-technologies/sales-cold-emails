import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("API proxy pattern", () => {
  it("should check API_SERVICE_URL for mock mode", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain("API_SERVICE_URL");
    expect(content).toContain("isMockMode");
  });

  it("should read API key from cookie for per-user auth", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain("mcpf_api_key");
    expect(content).toContain("X-API-Key");
    expect(content).toContain("cookies");
    expect(content).not.toContain("Bearer");
    expect(content).not.toContain("@clerk");
  });

  it("should have proxyToApi and proxySSE functions", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain("proxyToApi");
    expect(content).toContain("proxySSE");
  });

  it("should expose getOrgId and getUserId helpers", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain("getOrgId");
    expect(content).toContain("getUserId");
    expect(content).toContain("mcpf_org_id");
    expect(content).toContain("mcpf_user_id");
  });

  it("should send x-org-id and x-user-id headers in getHeaders", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain('"x-org-id"');
    expect(content).toContain('"x-user-id"');
  });
});

describe("Auth provision route", () => {
  it("should call MCPFactory /v1/auth/provision endpoint", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/auth/provision/route.ts"),
      "utf-8"
    );
    expect(content).toContain("/v1/auth/provision");
    expect(content).toContain("mcpf_api_key");
    expect(content).toContain("httpOnly");
    expect(content).toContain("emailAddresses");
  });

  it("should support mock mode", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/auth/provision/route.ts"),
      "utf-8"
    );
    expect(content).toContain("mock_key");
    expect(content).toContain("API_SERVICE_URL");
  });

  it("should store orgId and userId cookies alongside apiKey", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/auth/provision/route.ts"),
      "utf-8"
    );
    expect(content).toContain("mcpf_org_id");
    expect(content).toContain("mcpf_user_id");
    expect(content).toContain("orgId");
    expect(content).toContain("provisionedUserId");
  });
});
