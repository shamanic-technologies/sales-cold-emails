import { NextResponse } from "next/server";
import { isBillingMockMode, proxyToBilling } from "@/lib/billing-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isBillingMockMode()) {
    return NextResponse.json([
      { amount: 200, description: "Welcome credit", timestamp: new Date().toISOString() },
      { amount: -15, description: "Campaign: Demo — lead enrichment", timestamp: new Date(Date.now() - 3600000).toISOString() },
      { amount: -8, description: "Campaign: Demo — email generation", timestamp: new Date(Date.now() - 7200000).toISOString() },
    ]);
  }

  const upstream = await proxyToBilling("/v1/accounts/transactions");
  const data = await upstream.json();
  // Billing-service wraps in { transactions: [...], has_more } with snake_case fields
  const raw = Array.isArray(data?.transactions) ? data.transactions : [];
  const transactions = raw.map((tx: { amount_cents?: number; description?: string; created_at?: string }) => ({
    amount: tx.amount_cents ?? 0,
    description: tx.description ?? "",
    timestamp: tx.created_at ?? new Date().toISOString(),
  }));
  return NextResponse.json(transactions, { status: upstream.status });
}
