import { NextRequest, NextResponse } from "next/server";
import { isMockMode, proxyToApi } from "@/lib/api-proxy";
import { generateInitialDag } from "@/lib/mock-data";
import type { OnboardingInput } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? "sales";
  const channel = searchParams.get("channel") ?? "email";
  const audienceType = searchParams.get("audienceType") ?? "cold-outreach";
  const objective = searchParams.get("objective") ?? "replies";

  if (isMockMode()) {
    const dag = generateInitialDag({} as OnboardingInput);
    return NextResponse.json({
      workflow: {
        id: "mock-best-workflow-id",
        name: "sales-email-cold-outreach-mock",
        category,
        channel,
        audienceType,
        signature: "mock-sig",
        signatureName: "mock",
      },
      dag: {
        nodes: dag.nodes.map((n) => ({
          id: n.id,
          type: "http.call",
          config: { service: n.type },
        })),
        edges: dag.edges.map((e) => ({ from: e.source, to: e.target })),
      },
      stats: {
        totalCostInUsdCents: 150,
        totalOutcomes: 12,
        costPerOutcome: 12.5,
        completedRuns: 5,
      },
    });
  }

  const params = new URLSearchParams({
    category,
    channel,
    audienceType,
    objective,
  });
  const upstream = await proxyToApi(`/v1/workflows/best?${params}`);
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
