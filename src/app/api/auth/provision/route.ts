import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const API_SERVICE_URL = process.env.API_SERVICE_URL;

export async function POST() {
  if (!API_SERVICE_URL) {
    // Mock mode — set a fake key
    const cookieStore = await cookies();
    const mockOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    };
    cookieStore.set("mcpf_api_key", "mock_key", mockOpts);
    cookieStore.set("mcpf_org_id", "mock_org_id", mockOpts);
    cookieStore.set("mcpf_user_id", "mock_user_id", mockOpts);
    return NextResponse.json({ ok: true, mock: true });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user info from Clerk
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ error: "No email found" }, { status: 400 });
  }

  // Call MCPFactory provision endpoint
  const res = await fetch(`${API_SERVICE_URL}/v1/auth/provision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      profilePicture: user.imageUrl ?? undefined,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: "Provisioning failed", details: data },
      { status: res.status }
    );
  }

  const { apiKey, userId: provisionedUserId, orgId } = await res.json();

  // Store API key + identity in httpOnly cookies
  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
  cookieStore.set("mcpf_api_key", apiKey, cookieOpts);
  cookieStore.set("mcpf_org_id", orgId, cookieOpts);
  cookieStore.set("mcpf_user_id", provisionedUserId, cookieOpts);

  return NextResponse.json({ ok: true });
}
