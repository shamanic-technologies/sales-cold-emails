const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL;
const CHAT_SERVICE_API_KEY = process.env.CHAT_SERVICE_API_KEY;
const KEY_SERVICE_URL = process.env.KEY_SERVICE_URL;
const KEY_SERVICE_API_KEY = process.env.KEY_SERVICE_API_KEY;
const TRANSACTIONAL_EMAIL_SERVICE_URL = process.env.TRANSACTIONAL_EMAIL_SERVICE_URL;
const TRANSACTIONAL_EMAIL_SERVICE_API_KEY = process.env.TRANSACTIONAL_EMAIL_SERVICE_API_KEY;

const APP_ID = "sales-cold-emails";

// ── Chat service system prompt ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a cold email campaign assistant for Sales Cold Emails. You help users configure and launch personalized cold email campaigns.

## Your Behavior

1. Greet the user briefly. Mention you're analyzing their brand website and generating a workflow.
2. Ask ONE question at a time about their campaign. You need these 6 pieces of information:
   - **target_audience**: Who is their ideal customer? Role, industry, company size.
   - **value_for_target**: What value do they offer? What problem do they solve?
   - **urgency**: Any time-sensitive angles? Limited pricing, deadlines, seasonal factors.
   - **scarcity**: Any capacity constraints? Limited spots, waitlists, exclusive access.
   - **risk_reversal**: What de-risks the decision? Free trial, guarantee, demo.
   - **social_proof**: What builds trust? Customer logos, metrics, testimonials.

3. Use the "context" provided (brand suggestions from website scraping, onboarding input) to make intelligent pre-filled suggestions. When you have a suggestion for a field, present it naturally and ask if they'd like to use it or customize.

4. Be conversational and helpful. If the user gives a vague answer, gently probe for more detail. If they give a great answer, acknowledge it and move on.

5. You do NOT need to ask them in a fixed order. Adapt based on the conversation. But you must gather all 6 before proceeding.

6. When you have gathered all 6 answers, output a JSON block tagged with \`campaign_answers\` containing the structured data. Format:

\`\`\`campaign_answers
{
  "target_audience": "...",
  "value_for_target": "...",
  "urgency": "...",
  "scarcity": "...",
  "risk_reversal": "...",
  "social_proof": "..."
}
\`\`\`

Follow this JSON block with a message like: "I have everything I need! The workflow is ready — say **go** to launch your campaign, or tell me what you'd like to change."

7. After outputting campaign_answers, if the user asks to modify something, update the relevant field and output a new \`campaign_answers\` block with all 6 fields.

8. When the user approves (says "go", "start", "launch", "approve", "yes", "ok", "lgtm"), respond confirming launch. Do NOT output another campaign_answers block.

## Rules
- Never make up information about the user's business
- Keep responses concise (2-4 sentences per message)
- Always use markdown formatting for emphasis
- Do not discuss pricing, your own capabilities, or anything outside campaign configuration
`;

// ── Chat config (lazy registration) ─────────────────────────────────────────

let configRegistered = false;

export async function ensureAppConfigRegistered(orgId: string, userId: string): Promise<void> {
  if (configRegistered) return;
  if (!CHAT_SERVICE_URL || !CHAT_SERVICE_API_KEY) {
    console.log("[instrumentation] CHAT_SERVICE_URL not set, skipping app config registration");
    return;
  }

  try {
    const res = await fetch(`${CHAT_SERVICE_URL}/apps/${APP_ID}/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CHAT_SERVICE_API_KEY,
        "x-org-id": orgId,
        "x-user-id": userId,
      },
      body: JSON.stringify({ systemPrompt: SYSTEM_PROMPT }),
    });

    if (!res.ok) {
      console.error("[instrumentation] Failed to register app config:", res.status, await res.text());
    } else {
      configRegistered = true;
      console.log("[instrumentation] App config registered successfully");
    }
  } catch (err) {
    console.error("[instrumentation] Error registering app config:", err);
  }
}

// ── Key-service: register app secrets ────────────────────────────────────────

async function registerAppKey(provider: string, apiKey: string): Promise<void> {
  if (!KEY_SERVICE_URL || !KEY_SERVICE_API_KEY) {
    console.warn(`[instrumentation] KEY_SERVICE not configured — skipping ${provider} registration`);
    return;
  }

  const res = await fetch(`${KEY_SERVICE_URL}/internal/app-keys`, {
    method: "POST",
    headers: {
      "x-api-key": KEY_SERVICE_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({ appId: APP_ID, provider, apiKey }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to register ${provider} key: ${res.status} ${body}`);
  }
}

async function registerAppSecrets(): Promise<void> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const geminiKey = process.env.GEMINI_API_KEY;

  const registrations: Promise<void>[] = [];

  if (geminiKey) {
    registrations.push(registerAppKey("gemini", geminiKey));
  }
  if (stripeKey) {
    registrations.push(registerAppKey("stripe", stripeKey));
  }
  if (webhookSecret) {
    registrations.push(registerAppKey("stripe-webhook", webhookSecret));
  }

  if (registrations.length > 0) {
    await Promise.all(registrations);
    console.log("[instrumentation] App secrets registered with key-service");
  } else {
    console.log("[instrumentation] No secrets found in env, skipping key-service registration");
  }
}

// ── Transactional email templates ───────────────────────────────────────────

async function registerEmailTemplates(): Promise<void> {
  if (!TRANSACTIONAL_EMAIL_SERVICE_URL || !TRANSACTIONAL_EMAIL_SERVICE_API_KEY) {
    console.log("[instrumentation] TRANSACTIONAL_EMAIL_SERVICE not configured, skipping template registration");
    return;
  }

  const templates = [
    {
      name: "welcome",
      subject: "Welcome to Sales Cold Emails — your campaign assistant is ready",
      htmlBody: `<p>Hi{{#firstName}} {{firstName}}{{/firstName}},</p>
<p>Welcome to <strong>Sales Cold Emails</strong>! Your account is set up and ready to go.</p>
<p>Here's how to get started:</p>
<ol>
  <li>Enter your brand website URL</li>
  <li>Chat with our AI assistant to configure your campaign</li>
  <li>Launch and watch your outreach run automatically</li>
</ol>
<p>You have <strong>$2.00 in free credits</strong> to try your first campaign — no credit card required.</p>
<p><a href="{{dashboardUrl}}">Go to your dashboard →</a></p>
<p>Questions? Just reply to this email.</p>`,
      textBody: `Hi{{#firstName}} {{firstName}}{{/firstName}},

Welcome to Sales Cold Emails! Your account is set up and ready to go.

Here's how to get started:
1. Enter your brand website URL
2. Chat with our AI assistant to configure your campaign
3. Launch and watch your outreach run automatically

You have $2.00 in free credits to try your first campaign — no credit card required.

Go to your dashboard: {{dashboardUrl}}

Questions? Just reply to this email.`,
    },
    {
      name: "campaign_launched",
      subject: "Your campaign \"{{campaignName}}\" is live!",
      htmlBody: `<p>Hi{{#firstName}} {{firstName}}{{/firstName}},</p>
<p>Your campaign <strong>{{campaignName}}</strong> is now running.</p>
<p>We'll find leads matching your target audience, generate personalized emails, and send them automatically.</p>
<p><a href="{{dashboardUrl}}">Track progress on your dashboard →</a></p>`,
      textBody: `Hi{{#firstName}} {{firstName}}{{/firstName}},

Your campaign "{{campaignName}}" is now running.

We'll find leads matching your target audience, generate personalized emails, and send them automatically.

Track progress: {{dashboardUrl}}`,
    },
    {
      name: "campaign_completed",
      subject: "Campaign \"{{campaignName}}\" — results are in",
      htmlBody: `<p>Hi{{#firstName}} {{firstName}}{{/firstName}},</p>
<p>Your campaign <strong>{{campaignName}}</strong> has completed. Here's a summary:</p>
<ul>
  <li><strong>Emails sent:</strong> {{emailsSent}}</li>
  <li><strong>Opened:</strong> {{emailsOpened}}</li>
  <li><strong>Replied:</strong> {{emailsReplied}}</li>
  <li><strong>Total cost:</strong> \${{totalCostUsd}}</li>
</ul>
<p><a href="{{dashboardUrl}}">View full results →</a></p>`,
      textBody: `Hi{{#firstName}} {{firstName}}{{/firstName}},

Your campaign "{{campaignName}}" has completed. Here's a summary:

- Emails sent: {{emailsSent}}
- Opened: {{emailsOpened}}
- Replied: {{emailsReplied}}
- Total cost: \${{totalCostUsd}}

View full results: {{dashboardUrl}}`,
    },
    {
      name: "low_credits",
      subject: "Your credits are running low",
      htmlBody: `<p>Hi{{#firstName}} {{firstName}}{{/firstName}},</p>
<p>Your Sales Cold Emails balance is down to <strong>\${{remainingCredits}}</strong>.</p>
<p>Top up to keep your campaigns running without interruption.</p>
<p><a href="{{billingUrl}}">Add credits →</a></p>`,
      textBody: `Hi{{#firstName}} {{firstName}}{{/firstName}},

Your Sales Cold Emails balance is down to \${{remainingCredits}}.

Top up to keep your campaigns running without interruption.

Add credits: {{billingUrl}}`,
    },
  ];

  const res = await fetch(`${TRANSACTIONAL_EMAIL_SERVICE_URL}/templates`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TRANSACTIONAL_EMAIL_SERVICE_API_KEY,
    },
    body: JSON.stringify({ appId: APP_ID, templates }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`[instrumentation] Failed to register email templates: ${res.status} ${text}`);
  } else {
    console.log("[instrumentation] Email templates registered successfully");
  }
}

// ── Startup ─────────────────────────────────────────────────────────────────

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  console.log("[instrumentation] Running startup registrations...");

  const results = await Promise.allSettled([
    registerAppSecrets(),
    registerEmailTemplates(),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[instrumentation] Startup registration failed:", result.reason);
    }
  }

  if (CHAT_SERVICE_URL && CHAT_SERVICE_API_KEY) {
    console.log("[instrumentation] Chat app config will be registered lazily on first chat request");
  }

  console.log("[instrumentation] Startup registrations complete");
}
