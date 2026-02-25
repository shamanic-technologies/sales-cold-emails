import { NextRequest, NextResponse } from "next/server";
import { isMockMode, getAuthToken, proxyToApi } from "@/lib/api-proxy";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isMockMode()) {
    return NextResponse.json([]);
  }

  const token = await getAuthToken();
  const upstream = await proxyToApi(`/v1/campaigns/${id}/leads`, { token });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
