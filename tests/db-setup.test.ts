import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const read = (p: string) =>
  fs.readFileSync(path.join(__dirname, p), "utf-8");

describe("DB schema", () => {
  const src = read("../src/lib/db/schema.ts");

  it("should define campaign_setups table with pgTable", () => {
    expect(src).toContain("pgTable");
    expect(src).toContain("campaign_setups");
  });

  it("should have org_id as unique and user_id as required", () => {
    expect(src).toContain("org_id");
    expect(src).toContain(".unique()");
    expect(src).toContain("user_id");
    expect(src).toContain(".notNull()");
  });

  it("should have onboarding columns", () => {
    expect(src).toContain("brand_url");
    expect(src).toContain("objective");
    expect(src).toContain("objective_url");
    expect(src).toContain("budget_type");
    expect(src).toContain("budget_amount");
    expect(src).toContain("pricing_tier");
  });

  it("should have campaign answer columns", () => {
    expect(src).toContain("target_audience");
    expect(src).toContain("value_for_target");
    expect(src).toContain("urgency");
    expect(src).toContain("scarcity");
    expect(src).toContain("risk_reversal");
    expect(src).toContain("social_proof");
  });

  it("should have session reference columns", () => {
    expect(src).toContain("chat_session_id");
    expect(src).toContain("workflow_id");
    expect(src).toContain("workflow_name");
    expect(src).toContain("campaign_id");
  });

  it("should have phase state columns", () => {
    expect(src).toContain("is_approved");
    expect(src).toContain("dashboard_view");
  });

  it("should have timestamps", () => {
    expect(src).toContain("created_at");
    expect(src).toContain("updated_at");
  });
});

describe("DB client", () => {
  const src = read("../src/lib/db/index.ts");

  it("should export isDbMockMode and getDb", () => {
    expect(src).toContain("export function isDbMockMode");
    expect(src).toContain("export function getDb");
  });

  it("should use SALES_COLD_EMAILS_DATABASE_URL env var", () => {
    expect(src).toContain("SALES_COLD_EMAILS_DATABASE_URL");
  });

  it("should use neon serverless driver", () => {
    expect(src).toContain("@neondatabase/serverless");
    expect(src).toContain("drizzle-orm/neon-http");
  });
});

describe("setup API route", () => {
  const src = read("../src/app/api/setup/route.ts");

  it("should export GET and PUT handlers", () => {
    expect(src).toContain("export async function GET");
    expect(src).toContain("export async function PUT");
  });

  it("should check isDbMockMode", () => {
    expect(src).toContain("isDbMockMode");
  });

  it("should check org identity and return 401 when missing", () => {
    expect(src).toContain("getOrgId");
    expect(src).toContain("401");
  });

  it("should use ON CONFLICT for upsert", () => {
    expect(src).toContain("onConflictDoUpdate");
  });
});

describe("API client setup functions", () => {
  const src = read("../src/lib/api-client.ts");

  it("should export CampaignSetup interface", () => {
    expect(src).toContain("export interface CampaignSetup");
  });

  it("should have getSetup calling /api/setup", () => {
    expect(src).toContain("getSetup");
    expect(src).toContain("/api/setup");
  });

  it("should have saveSetup as fire-and-forget (no await)", () => {
    expect(src).toContain("export function saveSetup");
    // saveSetup should not be async — fire-and-forget
    expect(src).not.toContain("export async function saveSetup");
  });
});

describe("store hydration", () => {
  const src = read("../src/lib/store.ts");

  it("should have hydrateFromServer action", () => {
    expect(src).toContain("hydrateFromServer");
  });

  it("should import CampaignSetup type", () => {
    expect(src).toContain("CampaignSetup");
  });

  it("should only fill missing local state", () => {
    // Checks that localStorage wins — only fills when state is empty
    expect(src).toContain("!state.onboardingInput");
    expect(src).toContain("!state.chatSessionId");
    expect(src).toContain("!state.campaignId");
  });
});

describe("setup sync hook", () => {
  const src = read("../src/lib/use-setup-sync.ts");

  it("should export useSetupSync hook", () => {
    expect(src).toContain("export function useSetupSync");
  });

  it("should call getSetup and hydrateFromServer", () => {
    expect(src).toContain("getSetup");
    expect(src).toContain("hydrateFromServer");
  });

  it("should run only once per session", () => {
    expect(src).toContain("didRun");
  });
});

describe("dashboard shell integration", () => {
  const src = read("../src/components/dashboard/dashboard-shell.tsx");

  it("should call useSetupSync", () => {
    expect(src).toContain("useSetupSync");
  });
});

describe("save points", () => {
  it("should have saveSetup calls in use-chat.ts", () => {
    const src = read("../src/components/chat/use-chat.ts");
    expect(src).toContain("saveSetup");
    expect(src).toContain("buildSetupPayload");
    // At least 5 saveSetup calls
    const matches = src.match(/saveSetup\(/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(5);
  });

  it("should have saveSetup call in hero-form.tsx", () => {
    const src = read("../src/components/landing/hero-form.tsx");
    expect(src).toContain("saveSetup");
  });
});
