import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("route handlers", () => {
  it("should have workflow generate route with mock fallback", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/workflows/generate/route.ts"),
      "utf-8"
    );
    expect(content).toContain("isMockMode");
    expect(content).toContain("proxyToApi");
    expect(content).toContain("/v1/workflows/generate");
  });

  it("should have campaign creation route", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/campaigns/route.ts"),
      "utf-8"
    );
    expect(content).toContain("POST");
    expect(content).toContain("/v1/campaigns");
    expect(content).toContain("isMockMode");
  });

  it("should have SSE stream route with text/event-stream", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/campaigns/[id]/stream/route.ts"),
      "utf-8"
    );
    expect(content).toContain("text/event-stream");
    expect(content).toContain("ReadableStream");
    expect(content).toContain("proxySSE");
  });

  it("should have campaign stats route", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/campaigns/[id]/stats/route.ts"),
      "utf-8"
    );
    expect(content).toContain("proxyToApi");
    expect(content).toContain("/v1/campaigns/");
    expect(content).toContain("/stats");
  });

  it("should await params in dynamic routes (Next.js 16)", () => {
    const stream = fs.readFileSync(
      path.join(__dirname, "../src/app/api/campaigns/[id]/stream/route.ts"),
      "utf-8"
    );
    const stats = fs.readFileSync(
      path.join(__dirname, "../src/app/api/campaigns/[id]/stats/route.ts"),
      "utf-8"
    );
    expect(stream).toContain("await params");
    expect(stats).toContain("await params");
  });
});
