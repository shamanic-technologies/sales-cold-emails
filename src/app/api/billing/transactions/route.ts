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
  return NextResponse.json(data, { status: upstream.status });
}
