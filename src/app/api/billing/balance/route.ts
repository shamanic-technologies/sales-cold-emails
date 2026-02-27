import { NextResponse } from "next/server";
import { isMockMode, proxyToApi } from "@/lib/api-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isMockMode()) {
    return NextResponse.json({
      balance_cents: 200,
      billing_mode: "credits",
      depleted: false,
    });
  }

  const upstream = await proxyToApi("/v1/billing/accounts/balance");
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
