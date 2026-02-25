import type {
  OnboardingInput,
  WorkflowDag,
  ResultRow,
  ResultStatus,
} from "./types";

export function generateInitialDag(_input: OnboardingInput): WorkflowDag {
  return {
    nodes: [
      {
        id: "1",
        type: "lead-source",
        label: "Lead Sourcing",
        description: "Find prospects matching your ICP via Apollo",
        status: "pending",
      },
      {
        id: "2",
        type: "enrichment",
        label: "Company Research",
        description: "Enrich with company data, recent news, tech stack",
        status: "pending",
      },
      {
        id: "3",
        type: "email-generation",
        label: "Email Personalization",
        description: "Generate personalized email with Claude",
        status: "pending",
      },
      {
        id: "4",
        type: "sending",
        label: "Email Delivery",
        description: "Send via your email provider",
        status: "pending",
      },
      {
        id: "5",
        type: "tracking",
        label: "Response Tracking",
        description: "Track opens, clicks, and replies",
        status: "pending",
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-4", source: "3", target: "4" },
      { id: "e4-5", source: "4", target: "5" },
    ],
  };
}

export function generateModifiedDag(feedback: string): WorkflowDag {
  const base = generateInitialDag({} as OnboardingInput);
  const lower = feedback.toLowerCase();

  if (lower.includes("linkedin") || lower.includes("multi")) {
    base.nodes.splice(4, 0, {
      id: "3b",
      type: "sending",
      label: "LinkedIn Follow-up",
      description: "Send LinkedIn connection request after email",
      status: "pending",
    });
    base.edges.push({ id: "e3-3b", source: "3", target: "3b" });
    base.edges = base.edges.map((e) =>
      e.id === "e3-4" ? { ...e, source: "3b" } : e
    );
  }

  if (lower.includes("a/b") || lower.includes("test") || lower.includes("variant")) {
    base.nodes.splice(3, 0, {
      id: "3a",
      type: "email-generation",
      label: "A/B Variant Generation",
      description: "Create two email variants for testing",
      status: "pending",
    });
    base.edges.push({ id: "e3-3a", source: "3", target: "3a" });
  }

  return base;
}

const MOCK_PROSPECTS = [
  { company: "Stripe", person: "Sarah Chen", title: "VP of Engineering", email: "sarah.c@stripe.com" },
  { company: "Notion", person: "Marcus Rivera", title: "Head of Growth", email: "marcus@notion.so" },
  { company: "Figma", person: "Emily Watson", title: "Director of Sales", email: "e.watson@figma.com" },
  { company: "Linear", person: "Alex Kim", title: "CTO", email: "alex@linear.app" },
  { company: "Vercel", person: "Jordan Lee", title: "VP Sales", email: "jordan@vercel.com" },
  { company: "Supabase", person: "Priya Patel", title: "Head of Partnerships", email: "priya@supabase.io" },
  { company: "Datadog", person: "Thomas Mueller", title: "Director of Engineering", email: "t.mueller@datadoghq.com" },
  { company: "Twilio", person: "Rachel Adams", title: "VP of Product", email: "rachel.a@twilio.com" },
  { company: "Airtable", person: "David Zhang", title: "Head of Revenue", email: "dzhang@airtable.com" },
  { company: "Retool", person: "Sophie Bernard", title: "Director of Growth", email: "sophie@retool.com" },
  { company: "Amplitude", person: "Chris Nakamura", title: "VP Marketing", email: "chris.n@amplitude.com" },
  { company: "Loom", person: "Anna Kowalski", title: "Head of Sales", email: "anna@loom.com" },
  { company: "Miro", person: "James Okafor", title: "CRO", email: "james.o@miro.com" },
  { company: "Intercom", person: "Lisa Park", title: "Director of BD", email: "lisa@intercom.com" },
  { company: "Mixpanel", person: "Ryan Scott", title: "VP Engineering", email: "ryan@mixpanel.com" },
  { company: "PostHog", person: "Marie Dupont", title: "Head of Growth", email: "marie@posthog.com" },
  { company: "Clerk", person: "Nathan Brooks", title: "Head of Sales", email: "nathan@clerk.dev" },
  { company: "PlanetScale", person: "Yuki Tanaka", title: "Director of Engineering", email: "yuki@planetscale.com" },
  { company: "Resend", person: "Carlos Mendez", title: "CTO", email: "carlos@resend.com" },
  { company: "Neon", person: "Olga Ivanova", title: "VP of Product", email: "olga@neon.tech" },
];

export function generateMockEmail(
  company: string,
  person: string,
  brandDomain: string
): { subject: string; body: string } {
  return {
    subject: `Quick question about ${company}'s growth strategy`,
    body: `Hi ${person.split(" ")[0]},\n\nI noticed ${company} has been scaling rapidly — congrats on the recent momentum.\n\nAt ${brandDomain}, we help companies like yours automate outbound sales without sacrificing personalization. We've helped teams similar to yours increase reply rates by 3x while cutting time spent on prospecting by 80%.\n\nWould you be open to a quick 15-minute chat this week to see if there's a fit?\n\nBest,\nThe ${brandDomain} Team`,
  };
}

const STATUS_PROGRESSION: ResultStatus[] = [
  "queued",
  "researching",
  "generating",
  "sending",
  "sent",
];

export function startResultsSimulation(
  addResult: (row: ResultRow) => void,
  updateResult: (id: string, updates: Partial<ResultRow>) => void,
  brand: string
): () => void {
  let index = 0;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const addNext = () => {
    if (index >= MOCK_PROSPECTS.length) return;
    const prospect = MOCK_PROSPECTS[index];
    const id = `result-${index}`;
    const { subject, body } = generateMockEmail(
      prospect.company,
      prospect.person,
      brand
    );

    addResult({
      id,
      companyName: prospect.company,
      personName: prospect.person,
      personTitle: prospect.title,
      email: prospect.email,
      status: "queued",
      emailSubject: subject,
      emailBody: body,
      timestamp: Date.now(),
    });

    // Progress through statuses
    STATUS_PROGRESSION.forEach((status, i) => {
      if (i === 0) return;
      const delay = i * (1000 + Math.random() * 1500);
      timers.push(
        setTimeout(() => {
          updateResult(id, { status });
        }, delay)
      );
    });

    // Random chance of opened/replied
    timers.push(
      setTimeout(() => {
        if (Math.random() > 0.6) {
          updateResult(id, { status: "opened" });
          if (Math.random() > 0.7) {
            timers.push(
              setTimeout(() => {
                updateResult(id, { status: "replied" });
              }, 3000 + Math.random() * 5000)
            );
          }
        }
      }, 8000 + Math.random() * 5000)
    );

    index++;
    timers.push(setTimeout(addNext, 2000 + Math.random() * 2000));
  };

  addNext();

  return () => {
    timers.forEach(clearTimeout);
  };
}
