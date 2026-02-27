import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const read = (p: string) =>
  fs.readFileSync(path.join(__dirname, p), "utf-8");

describe("billing routes use unified api-proxy", () => {
  it("should NOT have a separate billing-proxy module", () => {
    const billingProxyPath = path.join(
      __dirname,
      "../src/lib/billing-proxy.ts"
    );
    expect(fs.existsSync(billingProxyPath)).toBe(false);
  });

  it("balance route should use isMockMode and proxyToApi from api-proxy", () => {
    const src = read("../src/app/api/billing/balance/route.ts");
    expect(src).toContain("isMockMode");
    expect(src).toContain("proxyToApi");
    expect(src).toContain("@/lib/api-proxy");
    expect(src).toContain("balance_cents");
    expect(src).not.toContain("billing-proxy");
    expect(src).not.toContain("ensureBillingAccount");
  });

  it("balance route should proxy to /v1/billing/accounts/balance", () => {
    const src = read("../src/app/api/billing/balance/route.ts");
    expect(src).toContain("/v1/billing/accounts/balance");
  });

  it("checkout route should proxy POST to /v1/billing/checkout-sessions", () => {
    const src = read("../src/app/api/billing/checkout/route.ts");
    expect(src).toContain("POST");
    expect(src).toContain("/v1/billing/checkout-sessions");
    expect(src).toContain("isMockMode");
    expect(src).toContain("proxyToApi");
    expect(src).not.toContain("billing-proxy");
  });

  it("transactions route should use isMockMode and proxyToApi", () => {
    const src = read("../src/app/api/billing/transactions/route.ts");
    expect(src).toContain("isMockMode");
    expect(src).toContain("proxyToApi");
    expect(src).toContain("/v1/billing/accounts/transactions");
    expect(src).not.toContain("billing-proxy");
  });

  it("transactions route should unwrap { transactions: [...] } and map snake_case fields", () => {
    const src = read("../src/app/api/billing/transactions/route.ts");
    expect(src).toContain("data?.transactions");
    expect(src).toContain("amount_cents");
    expect(src).toContain("created_at");
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
