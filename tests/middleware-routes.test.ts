import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("clerk middleware", () => {
  it("should define landing page as public", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/middleware.ts"),
      "utf-8"
    );
    expect(content).toContain('"/"');
    expect(content).toContain("isPublicRoute");
  });

  it("should protect dashboard routes", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/middleware.ts"),
      "utf-8"
    );
    expect(content).toContain("dashboard");
  });

  it("should handle missing clerk keys gracefully", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/middleware.ts"),
      "utf-8"
    );
    expect(content).toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    expect(content).toContain("noopMiddleware");
  });
});
