import { auth } from "@clerk/nextjs/server";

const API_SERVICE_URL = process.env.API_SERVICE_URL;

export function isMockMode(): boolean {
  return !API_SERVICE_URL;
}

export async function getAuthToken(): Promise<string> {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) throw new Error("Unauthorized");
  return token;
}

export async function proxyToApi(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token: string;
  }
): Promise<Response> {
  const url = `${API_SERVICE_URL}${path}`;
  return fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.token}`,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

export async function proxySSE(
  path: string,
  token: string
): Promise<Response> {
  const url = `${API_SERVICE_URL}${path}`;
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
  });
}
