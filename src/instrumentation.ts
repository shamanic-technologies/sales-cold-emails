const API_SERVICE_URL = process.env.API_SERVICE_URL;
const MCPF_APP_KEY = process.env.MCPF_APP_KEY;
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

// ── Chat config (lazy registration via api-service) ─────────────────────────

let configRegistered = false;

export async function ensureAppConfigRegistered(clerkIds?: { orgId: string | null; userId: string | null }): Promise<void> {
  if (configRegistered) return;
  if (!API_SERVICE_URL || !MCPF_APP_KEY) {
    console.log("[instrumentation] API_SERVICE not configured, skipping chat config registration");
    return;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MCPF_APP_KEY}`,
    };
    if (clerkIds?.orgId) headers["x-org-id"] = clerkIds.orgId;
    if (clerkIds?.userId) headers["x-user-id"] = clerkIds.userId;

    const res = await fetch(`${API_SERVICE_URL}/v1/chat/config`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ systemPrompt: SYSTEM_PROMPT }),
    });

    if (!res.ok) {
      console.error("[instrumentation] Failed to register chat config:", res.status, await res.text());
    } else {
      configRegistered = true;
      console.log("[instrumentation] Chat config registered successfully");
    }
  } catch (err) {
    console.error("[instrumentation] Error registering chat config:", err);
  }
}

// ── Provider keys: register as platform keys via api-service ────────────────

async function registerPlatformKey(provider: string, apiKey: string): Promise<void> {
  if (!API_SERVICE_URL || !MCPF_APP_KEY) {
    console.warn(`[instrumentation] API_SERVICE not configured — skipping ${provider} key registration`);
    return;
  }

  const res = await fetch(`${API_SERVICE_URL}/v1/platform-keys`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MCPF_APP_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ provider, apiKey }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to register ${provider} key: ${res.status} ${body}`);
  }
}

async function registerPlatformKeys(): Promise<void> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const geminiKey = process.env.GEMINI_API_KEY;

  const registrations: Promise<void>[] = [];

  if (geminiKey) {
    registrations.push(registerPlatformKey("gemini", geminiKey));
  }
  if (stripeKey) {
    registrations.push(registerPlatformKey("stripe", stripeKey));
  }
  if (webhookSecret) {
    registrations.push(registerPlatformKey("stripe-webhook", webhookSecret));
  }

  if (registrations.length > 0) {
    await Promise.all(registrations);
    console.log("[instrumentation] Platform keys registered via api-service");
  } else {
    console.log("[instrumentation] No secrets found in env, skipping key registration");
  }
}

// ── Startup ─────────────────────────────────────────────────────────────────

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  console.log("[instrumentation] Running startup registrations...");

  const results = await Promise.allSettled([
    registerPlatformKeys(),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[instrumentation] Startup registration failed:", result.reason);
    }
  }

  if (API_SERVICE_URL && MCPF_APP_KEY) {
    console.log("[instrumentation] Chat config will be registered lazily on first chat request");
  }

  console.log("[instrumentation] Startup registrations complete");
}
