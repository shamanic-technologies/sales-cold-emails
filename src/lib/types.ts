export interface OnboardingInput {
  brandUrl: string;
  objective: "responses" | "clicks";
  objectiveUrl?: string;
  budgetType: "one-off" | "daily" | "weekly" | "monthly";
  budgetAmount: number;
  pricingTier: "byok" | "pay-as-you-go";
}

export interface ChatMessage {
  id: string;
  role: "user" | "system";
  content: string;
  suggestion?: string;
  buttons?: Array<{ label: string; value: string }>;
  timestamp: number;
}

export interface BrandSuggestions {
  target_audience: string;
  value_for_target: string;
  urgency: string;
  scarcity: string;
  risk_reversal: string;
  social_proof: string;
}

export type DagNodeType =
  | "lead-source"
  | "enrichment"
  | "email-generation"
  | "sending"
  | "tracking";

export interface DagNode {
  id: string;
  type: DagNodeType;
  label: string;
  description: string;
  status: "pending" | "active" | "completed" | "error";
}

export interface DagEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowDag {
  nodes: DagNode[];
  edges: DagEdge[];
}

export type ResultStatus =
  | "queued"
  | "researching"
  | "generating"
  | "sending"
  | "sent"
  | "opened"
  | "replied";

export interface ResultRow {
  id: string;
  companyName: string;
  personName: string;
  personTitle: string;
  email: string;
  status: ResultStatus;
  emailSubject?: string;
  emailBody?: string;
  timestamp: number;
}

export type DashboardView = "dag" | "results";

// --- API Types ---

export interface GenerateWorkflowRequest {
  description: string;
  hints?: {
    services?: string[];
    nodeTypes?: string[];
    expectedInputs?: string[];
  };
}

export interface GenerateWorkflowResponse {
  workflow: {
    id: string;
    name: string;
    category: string;
    channel: string;
    audienceType: string;
    signature: string;
    signatureName: string;
    action: "created" | "updated";
  };
  dag: ApiDag;
  generatedDescription: string;
}

export interface ApiDagNode {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  inputMapping?: Record<string, string>;
  retries?: number;
}

export interface ApiDagEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface ApiDag {
  nodes: ApiDagNode[];
  edges: ApiDagEdge[];
  onError?: string;
}

export interface CreateCampaignRequest {
  name: string;
  workflowName: string;
  brandUrl: string;
  targetAudience: string;
  targetOutcome: string;
  valueForTarget: string;
  urgency: string;
  scarcity: string;
  riskReversal: string;
  socialProof: string;
  maxBudgetDailyUsd?: number;
  maxBudgetWeeklyUsd?: number;
  maxBudgetMonthlyUsd?: number;
  maxBudgetTotalUsd?: number;
  maxLeads?: number;
  endDate?: string;
}

export interface Campaign {
  id: string;
  name: string;
  workflowName: string;
  brandUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  campaignId: string;
  leadsServed: number;
  leadsBuffered: number;
  leadsSkipped: number;
  emailsGenerated: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  emailsBounced: number;
  totalCostUsd: number;
}

export interface CampaignAnswers {
  target_audience: string;
  value_for_target: string;
  urgency: string;
  scarcity: string;
  risk_reversal: string;
  social_proof: string;
}

export interface BestWorkflowStats {
  totalCostInUsdCents: number;
  totalOutcomes: number;
  costPerOutcome: number | null;
  completedRuns: number;
}

export interface BestWorkflowResponse {
  workflow: {
    id: string;
    name: string;
    category: string;
    channel: string;
    audienceType: string;
    signature: string;
    signatureName: string;
  };
  dag: ApiDag;
  stats: BestWorkflowStats;
}

// --- Billing Types ---

export interface BillingBalance {
  balance_cents: number;
  billing_mode: string;
  depleted: boolean;
}

export interface BillingTransaction {
  amount: number;
  description: string;
  timestamp: string;
}

export interface CheckoutSessionResponse {
  url: string;
  session_id: string;
}
