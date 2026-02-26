import type {
  GenerateWorkflowResponse,
  BestWorkflowResponse,
  CreateCampaignRequest,
  Campaign,
  CampaignStats,
  BrandSuggestions,
  BillingBalance,
  BillingTransaction,
  CheckoutSessionResponse,
} from "./types";

export async function getBestWorkflow(
  objective: "replies" | "clicks"
): Promise<BestWorkflowResponse> {
  const params = new URLSearchParams({
    category: "sales",
    channel: "email",
    audienceType: "cold-outreach",
    objective,
  });
  const res = await fetch(`/api/workflows/best?${params}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Best workflow fetch failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function generateWorkflow(
  description: string,
  hints?: { services?: string[]; nodeTypes?: string[]; expectedInputs?: string[] }
): Promise<GenerateWorkflowResponse> {
  const res = await fetch("/api/workflows/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, hints }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Workflow generation failed: ${text}`);
  }
  return res.json();
}

export async function createCampaign(
  body: CreateCampaignRequest
): Promise<Campaign> {
  const res = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Campaign creation failed: ${text}`);
  }
  return res.json();
}

export async function getCampaignStats(
  campaignId: string
): Promise<CampaignStats> {
  const res = await fetch(`/api/campaigns/${campaignId}/stats`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch stats: ${text}`);
  }
  return res.json();
}

export function connectCampaignStream(campaignId: string): EventSource {
  return new EventSource(`/api/campaigns/${campaignId}/stream`);
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: Record<string, unknown>;
}

export async function sendChatMessage(req: ChatRequest): Promise<Response> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat request failed: ${text}`);
  }
  return res;
}

export async function scrapeBrand(brandUrl: string): Promise<BrandSuggestions> {
  const res = await fetch("/api/brand/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brandUrl }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brand scrape failed: ${text}`);
  }
  return res.json();
}

// --- Billing ---

export async function getBillingBalance(): Promise<BillingBalance> {
  const res = await fetch("/api/billing/balance");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch balance: ${text}`);
  }
  return res.json();
}

export async function getTransactions(): Promise<BillingTransaction[]> {
  const res = await fetch("/api/billing/transactions");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch transactions: ${text}`);
  }
  return res.json();
}

export async function createCheckoutSession(
  reloadAmountCents: number
): Promise<CheckoutSessionResponse> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      success_url: `${window.location.origin}/dashboard/billing?success=true`,
      cancel_url: `${window.location.origin}/dashboard/billing?canceled=true`,
      reload_amount_cents: reloadAmountCents,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create checkout session: ${text}`);
  }
  return res.json();
}
