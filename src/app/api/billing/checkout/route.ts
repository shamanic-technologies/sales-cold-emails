import { NextRequest, NextResponse } from "next/server";
import { isMockMode, proxyToApi } from "@/lib/api-proxy";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (isMockMode()) {
    return NextResponse.json({
      url: "https://checkout.stripe.com/mock-session",
      session_id: `mock_cs_${crypto.randomUUID()}`,
    });
  }

  const body = await req.json();
  const upstream = await proxyToApi("/v1/billing/checkout-sessions", {
    method: "POST",
    body,
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
