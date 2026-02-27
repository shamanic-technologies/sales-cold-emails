import { cookies } from "next/headers";

const API_SERVICE_URL = process.env.API_SERVICE_URL;

export function isMockMode(): boolean {
  return !API_SERVICE_URL;
}

async function getApiKey(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("mcpf_api_key")?.value ?? null;
}

export async function getOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("mcpf_org_id")?.value ?? null;
}

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("mcpf_user_id")?.value ?? null;
}

async function getHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const apiKey = await getApiKey();
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }
  const orgId = await getOrgId();
  if (orgId) {
    headers["x-org-id"] = orgId;
  }
  const userId = await getUserId();
  if (userId) {
    headers["x-user-id"] = userId;
  }
  return headers;
}

export async function proxyToApi(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
  }
): Promise<Response> {
  const url = `${API_SERVICE_URL}${path}`;
  return fetch(url, {
    method: options?.method ?? "GET",
    headers: await getHeaders(),
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

export async function proxySSE(path: string): Promise<Response> {
  const url = `${API_SERVICE_URL}${path}`;
  return fetch(url, {
    headers: await getHeaders({ Accept: "text/event-stream" }),
  });
}
