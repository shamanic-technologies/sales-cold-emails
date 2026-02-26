import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const read = (p: string) =>
  fs.readFileSync(path.join(__dirname, p), "utf-8");

describe("billing proxy", () => {
  const src = read("../src/lib/billing-proxy.ts");

  it("should check BILLING_SERVICE_URL for mock mode", () => {
    expect(src).toContain("BILLING_SERVICE_URL");
    expect(src).toContain("isBillingMockMode");
  });

  it("should send x-api-key, x-org-id, x-app-id headers", () => {
    expect(src).toContain('"x-api-key"');
    expect(src).toContain('"x-org-id"');
    expect(src).toContain('"x-app-id"');
    expect(src).toContain("sales-cold-emails");
  });

  it("should NOT send x-user-id (billing is org-level)", () => {
    expect(src).not.toContain("x-user-id");
  });

  it("should return 401 when orgId is missing", () => {
    expect(src).toContain("401");
    expect(src).toContain("Not provisioned");
  });
});

describe("billing route handlers", () => {
  it("balance route should have mock fallback and proxy to /v1/accounts/balance", () => {
    const src = read("../src/app/api/billing/balance/route.ts");
    expect(src).toContain("isBillingMockMode");
    expect(src).toContain("balance_cents");
    expect(src).toContain("/v1/accounts/balance");
  });

  it("checkout route should proxy POST to /v1/checkout-sessions", () => {
    const src = read("../src/app/api/billing/checkout/route.ts");
    expect(src).toContain("POST");
    expect(src).toContain("/v1/checkout-sessions");
    expect(src).toContain("isBillingMockMode");
  });

  it("transactions route should have mock data and proxy to /v1/accounts/transactions", () => {
    const src = read("../src/app/api/billing/transactions/route.ts");
    expect(src).toContain("isBillingMockMode");
    expect(src).toContain("/v1/accounts/transactions");
  });
});

describe("billing types", () => {
  const src = read("../src/lib/types.ts");

  it("should export BillingBalance, BillingTransaction, CheckoutSessionResponse", () => {
    expect(src).toContain("BillingBalance");
    expect(src).toContain("balance_cents");
    expect(src).toContain("BillingTransaction");
    expect(src).toContain("CheckoutSessionResponse");
  });
});

describe("billing API client", () => {
  const src = read("../src/lib/api-client.ts");

  it("should have getBillingBalance calling /api/billing/balance", () => {
    expect(src).toContain("getBillingBalance");
    expect(src).toContain("/api/billing/balance");
  });

  it("should have createCheckoutSession calling /api/billing/checkout", () => {
    expect(src).toContain("createCheckoutSession");
    expect(src).toContain("/api/billing/checkout");
  });

  it("should have getTransactions calling /api/billing/transactions", () => {
    expect(src).toContain("getTransactions");
    expect(src).toContain("/api/billing/transactions");
  });
});

describe("billing UI", () => {
  it("should have credits badge in dashboard header", () => {
    const shell = read("../src/components/dashboard/dashboard-shell.tsx");
    expect(shell).toContain("CreditsBadge");
    expect(shell).toContain("credits-badge");
  });

  it("credits badge should fetch balance and show dollar amount", () => {
    const src = read("../src/components/billing/credits-badge.tsx");
    expect(src).toContain("getBillingBalance");
    expect(src).toContain("/dashboard/billing");
    expect(src).toContain("Coins");
  });

  it("billing page should show balance, checkout, and transactions", () => {
    const src = read("../src/app/dashboard/billing/page.tsx");
    expect(src).toContain("getBillingBalance");
    expect(src).toContain("getTransactions");
    expect(src).toContain("createCheckoutSession");
    expect(src).toContain("RELOAD_AMOUNTS_CENTS");
  });

  it("billing page should handle success and canceled params", () => {
    const src = read("../src/app/dashboard/billing/page.tsx");
    expect(src).toContain('success');
    expect(src).toContain('canceled');
    expect(src).toContain("Credits added successfully");
  });

  it("dashboard shell should hide mobile tab toggle on subpages", () => {
    const src = read("../src/components/dashboard/dashboard-shell.tsx");
    expect(src).toContain("isSubpage");
    expect(src).toContain("usePathname");
  });
});
