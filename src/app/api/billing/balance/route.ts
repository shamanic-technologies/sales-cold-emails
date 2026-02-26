import { NextResponse } from "next/server";
import { isBillingMockMode, proxyToBilling } from "@/lib/billing-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isBillingMockMode()) {
    return NextResponse.json({
      balance_cents: 200,
      billing_mode: "credits",
      depleted: false,
    });
  }

  const upstream = await proxyToBilling("/v1/accounts/balance");
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
