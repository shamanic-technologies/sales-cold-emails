import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;
const FROM_EMAIL = "kevin@salescoldemails.com";
const ADMIN_EMAIL = "kevin@salescoldemails.com";
const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  : "https://salescoldemails.com/dashboard";

interface ClerkUserEvent {
  type: string;
  data: {
    id: string;
    user_id?: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string | null;
  };
}

async function sendPostmarkEmail(params: {
  to: string;
  bcc?: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}): Promise<void> {
  if (!POSTMARK_API_KEY) {
    console.error("[webhook/clerk] POSTMARK_API_KEY not configured");
    return;
  }

  const body: Record<string, string> = {
    From: FROM_EMAIL,
    To: params.to,
    Subject: params.subject,
    HtmlBody: params.htmlBody,
    TextBody: params.textBody,
    MessageStream: "outbound",
  };
  if (params.bcc) body.Bcc = params.bcc;

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Postmark-Server-Token": POSTMARK_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`[webhook/clerk] Postmark error:`, res.status, await res.text());
  } else {
    console.log(`[webhook/clerk] Email sent to ${params.to}${params.bcc ? ` (bcc: ${params.bcc})` : ""}`);
  }
}

export async function POST(req: Request) {
  if (!CLERK_WEBHOOK_SECRET) {
    console.error("[webhook/clerk] CLERK_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

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

  // user.created → welcome email to user, BCC admin
  if (event.type === "user.created") {
    const email = event.data.email_addresses?.[0]?.email_address;
    if (!email) {
      console.warn("[webhook/clerk] user.created but no email address");
      return NextResponse.json({ ok: true });
    }

    const firstName = event.data.first_name;
    const greeting = firstName ? `Hi ${firstName},` : "Hi,";

    await sendPostmarkEmail({
      to: email,
      bcc: ADMIN_EMAIL,
      subject: "Welcome to Sales Cold Emails — your campaign assistant is ready",
      htmlBody: `<p>${greeting}</p>
<p>Welcome to <strong>Sales Cold Emails</strong>! Your account is set up and ready to go.</p>
<p>Here's how to get started:</p>
<ol>
  <li>Enter your brand website URL</li>
  <li>Chat with our AI assistant to configure your campaign</li>
  <li>Launch and watch your outreach run automatically</li>
</ol>
<p>You have <strong>$2.00 in free credits</strong> to try your first campaign — no credit card required.</p>
<p><a href="${DASHBOARD_URL}">Go to your dashboard →</a></p>
<p>Questions? Just reply to this email.</p>`,
      textBody: `${greeting}

Welcome to Sales Cold Emails! Your account is set up and ready to go.

Here's how to get started:
1. Enter your brand website URL
2. Chat with our AI assistant to configure your campaign
3. Launch and watch your outreach run automatically

You have $2.00 in free credits to try your first campaign — no credit card required.

Go to your dashboard: ${DASHBOARD_URL}

Questions? Just reply to this email.`,
    });
  }

  // session.created → signin notification to admin
  if (event.type === "session.created") {
    const userId = event.data.user_id;
    if (!userId) {
      console.warn("[webhook/clerk] session.created but no user_id");
      return NextResponse.json({ ok: true });
    }

    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const email = user.emailAddresses[0]?.emailAddress ?? "unknown";
      const firstName = user.firstName ?? "unknown";

      await sendPostmarkEmail({
        to: ADMIN_EMAIL,
        subject: `[Sales Cold Emails] Sign-in: ${email}`,
        htmlBody: `<p>User signed in:</p>
<ul>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>First name:</strong> ${firstName}</li>
  <li><strong>Clerk ID:</strong> ${userId}</li>
</ul>`,
        textBody: `User signed in:
- Email: ${email}
- First name: ${firstName}
- Clerk ID: ${userId}`,
      });
    } catch (err) {
      console.error("[webhook/clerk] Failed to fetch user for session.created:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
