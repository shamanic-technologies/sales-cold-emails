import { NextRequest, NextResponse } from "next/server";
import { isMockMode, proxyToApi } from "@/lib/api-proxy";
import { generateInitialDag } from "@/lib/mock-data";
import type { OnboardingInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  if (isMockMode()) {
    const dag = generateInitialDag({} as OnboardingInput);
    return NextResponse.json({
      workflow: {
        id: "mock-workflow-id",
        name: "sales-email-cold-outreach-mock",
        category: "sales",
        channel: "email",
        audienceType: "cold-outreach",
        signature: "mock-sig",
        signatureName: "mock",
        action: "created",
      },
      dag: {
        nodes: dag.nodes.map((n) => ({
          id: n.id,
          type: "http.call",
          config: { service: n.type },
        })),
        edges: dag.edges.map((e) => ({ from: e.source, to: e.target })),
      },
      generatedDescription: "Mock cold email outreach workflow",
    });
  }

  const body = await req.json();
  const upstream = await proxyToApi("/v1/workflows/generate", {
    method: "POST",
    body,
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
