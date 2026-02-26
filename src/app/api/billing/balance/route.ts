import { NextResponse } from "next/server";
import { isBillingMockMode, proxyToBilling, ensureBillingAccount } from "@/lib/billing-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isBillingMockMode()) {
    return NextResponse.json({
      balance_cents: 200,
      billing_mode: "credits",
      depleted: false,
    });
  }

  // Ensure billing account exists (auto-creates on first call)
  await ensureBillingAccount();

  const upstream = await proxyToBilling("/v1/accounts/balance");
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
