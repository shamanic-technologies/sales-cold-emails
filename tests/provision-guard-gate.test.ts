import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Unified auth: no provision guard needed", () => {
  it("should not have a provision-guard component (unified auth removed it)", () => {
    const guardPath = path.join(
      __dirname,
      "../src/components/dashboard/provision-guard.tsx"
    );
    expect(fs.existsSync(guardPath)).toBe(false);
  });

  it("dashboard layout should render DashboardShell directly without ProvisionGuard", () => {
    const layoutSrc = fs.readFileSync(
      path.join(__dirname, "../src/app/dashboard/layout.tsx"),
      "utf-8"
    );
    expect(layoutSrc).toContain("DashboardShell");
    expect(layoutSrc).not.toContain("ProvisionGuard");
    expect(layoutSrc).not.toContain("isProvisioned");
    expect(layoutSrc).not.toContain("cookies");
  });
});
