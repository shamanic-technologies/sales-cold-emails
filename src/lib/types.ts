export interface OnboardingInput {
  brandUrl: string;
  objective: "responses" | "clicks" | "meetings";
  objectiveUrl?: string;
  budgetType: "one-off" | "daily" | "weekly" | "monthly";
  budgetAmount: number;
  pricingTier: "byok" | "pay-as-you-go";
}

export interface ChatMessage {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: number;
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
