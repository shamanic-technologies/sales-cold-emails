import { NextRequest, NextResponse } from "next/server";
import { isMockMode, proxyToApi } from "@/lib/api-proxy";

export async function POST(req: NextRequest) {
  if (isMockMode()) {
    const body = await req.json();
    return NextResponse.json({
      id: `mock-campaign-${crypto.randomUUID()}`,
      name: body.name ?? "Mock Campaign",
      workflowName: body.workflowName ?? "mock-workflow",
      brandUrl: body.brandUrl ?? null,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const body = await req.json();
  const upstream = await proxyToApi("/v1/campaigns", {
    method: "POST",
    body,
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
