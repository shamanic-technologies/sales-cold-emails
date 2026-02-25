import { NextResponse } from "next/server";
import type { BrandSuggestions } from "@/lib/types";

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractSuggestions(
  pageText: string,
  brandDomain: string
): BrandSuggestions {
  const text = pageText.slice(0, 8000);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 15);

  const headlines = lines
    .filter((l) => l.length > 20 && l.length < 250)
    .slice(0, 5);
  const headlineText = headlines.join(". ");

  // Target audience: look for "for [descriptor]" patterns
  const forPattern =
    /(?:for|designed for|built for|made for|helping|we help|we serve|perfect for|ideal for)\s+([^.!?\n]{10,120})/i;
  const forMatch = text.match(forPattern);
  const target_audience = forMatch
    ? forMatch[1].trim().replace(/\s+/g, " ")
    : `Decision-makers and teams that would benefit from ${brandDomain}'s product or service.`;

  // Value proposition: from headlines
  const value_for_target =
    headlineText ||
    `${brandDomain} helps businesses achieve better results through our solution.`;

  // Social proof: look for numbers, testimonials, customer mentions
  const socialMatches: string[] = [];
  const numPattern =
    /(\d[\d,]*\+?\s*(?:customers?|clients?|companies|teams|users|businesses))/gi;
  const metricPattern = /(\d+[%x×]\s*[^.!?\n]{5,80})/gi;
  for (const m of text.matchAll(numPattern))
    socialMatches.push(m[1].trim());
  for (const m of text.matchAll(metricPattern))
    socialMatches.push(m[1].trim());
  // Look for quoted testimonials
  const quotePattern = /[""]([^""]{30,200})[""]/g;
  for (const m of text.matchAll(quotePattern))
    socialMatches.push(`"${m[1].trim()}"`);

  const social_proof =
    socialMatches.length > 0
      ? socialMatches.slice(0, 4).join(". ") + "."
      : `Trusted by companies using ${brandDomain}. Proven track record of results.`;

  // Urgency
  const urgencyPattern =
    /(?:limited[- ]time|act now|deadline|ends? (?:soon|today|this)|don'?t miss|last chance|early[- ]bird|before (?:it'?s|prices?))/i;
  const urgencyLine = lines.find((l) => urgencyPattern.test(l));
  const urgency =
    urgencyLine ||
    "Launch pricing available for a limited time — lock in your rate before it increases.";

  // Scarcity
  const scarcityPattern =
    /(?:limited (?:spots?|availability)|only \d+|exclusive|waitlist|invite[- ]only|spots? (?:remaining|left|available)|slots? (?:left|available))/i;
  const scarcityLine = lines.find((l) => scarcityPattern.test(l));
  const scarcity =
    scarcityLine ||
    "We onboard a limited number of new clients each month to ensure quality delivery.";

  // Risk reversal
  const riskPattern =
    /(?:free trial|money[- ]back|guarantee|no credit card|cancel anytime|risk[- ]free|refund|no commitment|free (?:demo|consultation|plan))/i;
  const riskLine = lines.find((l) => riskPattern.test(l));
  const risk_reversal =
    riskLine ||
    "Free trial — no credit card required. 30-day money-back guarantee.";

  return {
    target_audience,
    value_for_target,
    urgency,
    scarcity,
    risk_reversal,
    social_proof,
  };
}

function genericSuggestions(brandDomain: string): BrandSuggestions {
  return {
    target_audience: `Decision-makers and professionals who would benefit from ${brandDomain}'s offering.`,
    value_for_target: `${brandDomain} helps businesses improve their outcomes with a unique solution.`,
    urgency:
      "Launch pricing available for a limited time — lock in your rate before it increases.",
    scarcity:
      "We onboard a limited number of new clients each month to ensure quality delivery.",
    risk_reversal:
      "Free trial — no credit card required. 30-day money-back guarantee.",
    social_proof: `Trusted by companies using ${brandDomain}. Proven track record of results.`,
  };
}

export async function POST(request: Request) {
  const { brandUrl } = (await request.json()) as { brandUrl: string };

  if (!brandUrl) {
    return NextResponse.json(
      { error: "brandUrl is required" },
      { status: 400 }
    );
  }

  const brandDomain = (() => {
    try {
      return new URL(brandUrl).hostname.replace(/^www\./, "");
    } catch {
      return brandUrl;
    }
  })();

  let pageText = "";
  try {
    const res = await fetch(brandUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SalesColdEmails/1.0; +https://salescoldemails.com)",
      },
    });
    if (res.ok) {
      const html = await res.text();
      pageText = stripHtml(html);
    }
  } catch {
    // Fetch failed — fall back to generic suggestions
  }

  const suggestions = pageText
    ? extractSuggestions(pageText, brandDomain)
    : genericSuggestions(brandDomain);

  return NextResponse.json(suggestions);
}
