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

  it("should use X-API-Key header for authentication", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/api-proxy.ts"),
      "utf-8"
    );
    expect(content).toContain("API_SERVICE_API_KEY");
    expect(content).toContain("X-API-Key");
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
});
