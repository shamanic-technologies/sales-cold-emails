import { pgTable, uuid, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const campaignSetups = pgTable("campaign_setups", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: text("org_id").notNull().unique(),
  userId: text("user_id").notNull(),

  // Onboarding input
  brandUrl: text("brand_url"),
  objective: text("objective"),
  objectiveUrl: text("objective_url"),
  budgetType: text("budget_type"),
  budgetAmount: numeric("budget_amount", { precision: 10, scale: 2 }),
  pricingTier: text("pricing_tier"),

  // Campaign answers
  targetAudience: text("target_audience"),
  valueForTarget: text("value_for_target"),
  urgency: text("urgency"),
  scarcity: text("scarcity"),
  riskReversal: text("risk_reversal"),
  socialProof: text("social_proof"),

  // Session references
  chatSessionId: text("chat_session_id"),
  workflowId: text("workflow_id"),
  workflowName: text("workflow_name"),
  campaignId: text("campaign_id"),

  // Phase state
  isApproved: boolean("is_approved").default(false),
  dashboardView: text("dashboard_view").default("dag"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
