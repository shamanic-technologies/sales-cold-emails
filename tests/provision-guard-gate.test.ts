import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const layoutSrc = readFileSync(
  join(__dirname, "../src/app/dashboard/layout.tsx"),
  "utf-8"
);

const provisionGuardSrc = readFileSync(
  join(__dirname, "../src/components/dashboard/provision-guard.tsx"),
  "utf-8"
);

describe("Provision guard gates DashboardShell", () => {
  it("wraps DashboardShell inside ProvisionGuard when not provisioned", () => {
    // ProvisionGuard must be the outer wrapper containing DashboardShell,
    // NOT the other way around. This ensures ChatPanel and CreditsBadge
    // (inside DashboardShell) only mount after cookies are set.
    expect(layoutSrc).toContain("<ProvisionGuard>");
    expect(layoutSrc).toContain("</ProvisionGuard>");

    // DashboardShell must appear INSIDE ProvisionGuard in the not-provisioned path
    const provisionBlock = layoutSrc.slice(
      layoutSrc.indexOf("<ProvisionGuard>"),
      layoutSrc.indexOf("</ProvisionGuard>")
    );
    expect(provisionBlock).toContain("<DashboardShell>");
  });

  it("renders DashboardShell directly when already provisioned", () => {
    // When provisioned, DashboardShell renders without ProvisionGuard wrapper
    expect(layoutSrc).toContain("if (isProvisioned)");
    expect(layoutSrc).toContain(
      "return <DashboardShell>{children}</DashboardShell>"
    );
  });

  it("DashboardShell is never rendered outside provision gate", () => {
    // There should be no pattern where DashboardShell wraps ProvisionGuard
    // (the old broken pattern: <DashboardShell><ProvisionGuard>...)
    const lines = layoutSrc.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("<DashboardShell>")) {
        // The next non-empty content line should NOT be ProvisionGuard
        // unless DashboardShell is the child of ProvisionGuard
        const before = layoutSrc.slice(0, layoutSrc.indexOf(lines[i]));
        const afterDashShellOpen = before.lastIndexOf("<ProvisionGuard>");
        const afterDashShellClose = before.lastIndexOf("</ProvisionGuard>");
        // If ProvisionGuard opened before and hasn't closed, DashboardShell is inside it — correct
        // If DashboardShell is NOT inside ProvisionGuard, ensure it's in the provisioned branch
        if (afterDashShellOpen <= afterDashShellClose) {
          // DashboardShell is outside ProvisionGuard — must be in the isProvisioned branch
          expect(before).toContain("isProvisioned");
        }
      }
    }
  });

  it("ProvisionGuard calls provision endpoint and gates children", () => {
    expect(provisionGuardSrc).toContain("/api/auth/provision");
    expect(provisionGuardSrc).toContain('setStatus("ready")');
    expect(provisionGuardSrc).toContain("{children}");
    // Loading state must block children from rendering
    expect(provisionGuardSrc).toContain('"loading"');
  });
});
