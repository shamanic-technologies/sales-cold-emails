const API_SERVICE_URL = process.env.API_SERVICE_URL;
const API_SERVICE_API_KEY = process.env.API_SERVICE_API_KEY;

export function isMockMode(): boolean {
  return !API_SERVICE_URL;
}

function getHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (API_SERVICE_API_KEY) {
    headers["X-API-Key"] = API_SERVICE_API_KEY;
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
    headers: getHeaders(),
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

export async function proxySSE(path: string): Promise<Response> {
  const url = `${API_SERVICE_URL}${path}`;
  return fetch(url, {
    headers: getHeaders({ Accept: "text/event-stream" }),
  });
}
