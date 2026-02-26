import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const API_SERVICE_URL = process.env.API_SERVICE_URL;

export async function POST() {
  if (!API_SERVICE_URL) {
    // Mock mode — set a fake key
    const cookieStore = await cookies();
    cookieStore.set("mcpf_api_key", "mock_key", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
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

  const { apiKey } = await res.json();

  // Store API key in httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set("mcpf_api_key", apiKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return NextResponse.json({ ok: true });
}
