import { auth } from "@clerk/nextjs/server";

const API_SERVICE_URL = process.env.API_SERVICE_URL;
const MCPF_APP_KEY = process.env.MCPF_APP_KEY;

export function isMockMode(): boolean {
  return !API_SERVICE_URL || !MCPF_APP_KEY;
}

export async function getClerkIds(): Promise<{ orgId: string | null; userId: string | null }> {
  const session = await auth();
  return { orgId: session.orgId ?? null, userId: session.userId ?? null };
}

async function getHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (MCPF_APP_KEY) {
    headers["Authorization"] = `Bearer ${MCPF_APP_KEY}`;
  }

  const { orgId, userId } = await getClerkIds();
  if (orgId) {
    headers["x-org-id"] = orgId;
  }
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
