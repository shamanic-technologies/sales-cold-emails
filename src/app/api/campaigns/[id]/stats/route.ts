import { NextRequest, NextResponse } from "next/server";
import { isMockMode, getAuthToken, proxyToApi } from "@/lib/api-proxy";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isMockMode()) {
    return NextResponse.json({
      campaignId: id,
      leadsServed: 0,
      leadsBuffered: 0,
      leadsSkipped: 0,
      emailsGenerated: 0,
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      emailsReplied: 0,
      emailsBounced: 0,
      totalCostUsd: 0,
    });
  }

  const token = await getAuthToken();
  const upstream = await proxyToApi(`/v1/campaigns/${id}/stats`, { token });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
