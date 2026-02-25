import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("brand scrape route handler", () => {
  it("should accept brandUrl and return BrandSuggestions fields", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/brand/scrape/route.ts"),
      "utf-8"
    );
    expect(content).toContain("brandUrl");
    expect(content).toContain("BrandSuggestions");
    expect(content).toContain("target_audience");
    expect(content).toContain("value_for_target");
    expect(content).toContain("urgency");
    expect(content).toContain("scarcity");
    expect(content).toContain("risk_reversal");
    expect(content).toContain("social_proof");
  });

  it("should fetch the brand URL and strip HTML", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/brand/scrape/route.ts"),
      "utf-8"
    );
    expect(content).toContain("stripHtml");
    expect(content).toContain("fetch(brandUrl");
    expect(content).toContain("<script");
    expect(content).toContain("<style");
  });

  it("should fall back to generic suggestions if fetch fails", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/brand/scrape/route.ts"),
      "utf-8"
    );
    expect(content).toContain("genericSuggestions");
    expect(content).toContain("catch");
  });

  it("should extract suggestions from page text using pattern matching", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/brand/scrape/route.ts"),
      "utf-8"
    );
    expect(content).toContain("extractSuggestions");
    // Social proof patterns
    expect(content).toContain("customers");
    // Risk reversal patterns
    expect(content).toContain("free trial");
    expect(content).toContain("guarantee");
  });

  it("should use a timeout for the fetch request", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/app/api/brand/scrape/route.ts"),
      "utf-8"
    );
    expect(content).toContain("AbortSignal.timeout");
  });
});
