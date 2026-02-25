import type {
  GenerateWorkflowResponse,
  CreateCampaignRequest,
  Campaign,
  CampaignStats,
  BrandSuggestions,
} from "./types";

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
