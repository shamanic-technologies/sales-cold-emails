import { NextResponse } from "next/server";
import { Webhook } from "svix";

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
const TRANSACTIONAL_EMAIL_SERVICE_URL = process.env.TRANSACTIONAL_EMAIL_SERVICE_URL;
const TRANSACTIONAL_EMAIL_SERVICE_API_KEY = process.env.TRANSACTIONAL_EMAIL_SERVICE_API_KEY;
const APP_ID = "sales-cold-emails";
const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  : "https://salescoldemails.com/dashboard";

interface ClerkUserEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
  };
}

export async function POST(req: Request) {
  if (!CLERK_WEBHOOK_SECRET) {
    console.error("[webhook/clerk] CLERK_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Verify signature
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();

  let event: ClerkUserEvent;
  try {
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch (err) {
    console.error("[webhook/clerk] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Handle user.created → send welcome email
  if (event.type === "user.created") {
    const email = event.data.email_addresses[0]?.email_address;
    if (!email) {
      console.warn("[webhook/clerk] user.created but no email address");
      return NextResponse.json({ ok: true });
    }

    if (TRANSACTIONAL_EMAIL_SERVICE_URL && TRANSACTIONAL_EMAIL_SERVICE_API_KEY) {
      try {
        const res = await fetch(`${TRANSACTIONAL_EMAIL_SERVICE_URL}/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": TRANSACTIONAL_EMAIL_SERVICE_API_KEY,
          },
          body: JSON.stringify({
            appId: APP_ID,
            eventType: "welcome",
            recipientEmail: email,
            metadata: {
              firstName: event.data.first_name ?? undefined,
              dashboardUrl: DASHBOARD_URL,
            },
          }),
        });

        if (!res.ok) {
          console.error("[webhook/clerk] Failed to send welcome email:", res.status, await res.text());
        } else {
          console.log("[webhook/clerk] Welcome email sent to", email);
        }
      } catch (err) {
        console.error("[webhook/clerk] Error sending welcome email:", err);
      }
    } else {
      console.log("[webhook/clerk] Transactional email service not configured, skipping welcome email");
    }
  }

  return NextResponse.json({ ok: true });
}
