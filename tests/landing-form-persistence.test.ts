import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("landing form persistence", () => {
  it("should call setOnboardingInput before auth redirect", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/landing/hero-form.tsx"),
      "utf-8"
    );
    expect(content).toContain("setOnboardingInput");
    expect(content).toContain('router.push("/sign-up")');
  });

  it("should use persist middleware for onboardingInput", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/store.ts"),
      "utf-8"
    );
    expect(content).toContain("persist");
    expect(content).toContain("onboardingInput");
  });
});
