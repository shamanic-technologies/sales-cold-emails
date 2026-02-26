import { cookies } from "next/headers";

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL;
const BILLING_SERVICE_API_KEY = process.env.BILLING_SERVICE_API_KEY;
const APP_ID = "sales-cold-emails";

export function isBillingMockMode(): boolean {
  return !BILLING_SERVICE_URL;
}

async function getOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("mcpf_org_id")?.value ?? null;
}

/** Call GET /v1/accounts which auto-creates the billing account if it doesn't exist. */
export async function ensureBillingAccount(): Promise<void> {
  const resp = await proxyToBilling("/v1/accounts");
  if (!resp.ok && resp.status !== 401) {
    console.warn("ensureBillingAccount failed:", resp.status);
  }
}

export async function proxyToBilling(
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<Response> {
  const orgId = await getOrgId();

  if (!orgId) {
    return new Response(
      JSON.stringify({ error: "Not provisioned. Missing org identity." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = `${BILLING_SERVICE_URL}${path}`;
  return fetch(url, {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": BILLING_SERVICE_API_KEY!,
      "x-org-id": orgId,
      "x-app-id": APP_ID,
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
}
