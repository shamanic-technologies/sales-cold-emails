import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isDbMockMode, getDb } from "@/lib/db";
import { campaignSetups } from "@/lib/db/schema";
import { getClerkIds } from "@/lib/api-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isDbMockMode()) {
    return NextResponse.json(null);
  }

  const { orgId } = await getClerkIds();
  if (!orgId) {
    return NextResponse.json(
      { error: "Missing org identity. Ensure Clerk org is active." },
      { status: 401 }
    );
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(campaignSetups)
    .where(eq(campaignSetups.orgId, orgId))
    .limit(1);

  return NextResponse.json(rows[0] ?? null);
}

export async function PUT(request: Request) {
  if (isDbMockMode()) {
    return NextResponse.json({ ok: true });
  }

  const { orgId, userId } = await getClerkIds();
  if (!orgId || !userId) {
    return NextResponse.json(
      { error: "Missing identity. Ensure Clerk session is active." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const db = getDb();
  await db
    .insert(campaignSetups)
    .values({
      orgId,
      userId,
      brandUrl: body.brandUrl ?? null,
      objective: body.objective ?? null,
      objectiveUrl: body.objectiveUrl ?? null,
      budgetType: body.budgetType ?? null,
      budgetAmount: body.budgetAmount != null ? String(body.budgetAmount) : null,
      pricingTier: body.pricingTier ?? null,
      targetAudience: body.targetAudience ?? null,
      valueForTarget: body.valueForTarget ?? null,
      urgency: body.urgency ?? null,
      scarcity: body.scarcity ?? null,
      riskReversal: body.riskReversal ?? null,
      socialProof: body.socialProof ?? null,
      chatSessionId: body.chatSessionId ?? null,
      workflowId: body.workflowId ?? null,
      workflowName: body.workflowName ?? null,
      campaignId: body.campaignId ?? null,
      isApproved: body.isApproved ?? false,
      dashboardView: body.dashboardView ?? "dag",
    })
    .onConflictDoUpdate({
      target: campaignSetups.orgId,
      set: {
        userId,
        brandUrl: body.brandUrl ?? null,
        objective: body.objective ?? null,
        objectiveUrl: body.objectiveUrl ?? null,
        budgetType: body.budgetType ?? null,
        budgetAmount: body.budgetAmount != null ? String(body.budgetAmount) : null,
        pricingTier: body.pricingTier ?? null,
        targetAudience: body.targetAudience ?? null,
        valueForTarget: body.valueForTarget ?? null,
        urgency: body.urgency ?? null,
        scarcity: body.scarcity ?? null,
        riskReversal: body.riskReversal ?? null,
        socialProof: body.socialProof ?? null,
        chatSessionId: body.chatSessionId ?? null,
        workflowId: body.workflowId ?? null,
        workflowName: body.workflowName ?? null,
        campaignId: body.campaignId ?? null,
        isApproved: body.isApproved ?? false,
        dashboardView: body.dashboardView ?? "dag",
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}
