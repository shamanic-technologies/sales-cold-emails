import { NextRequest } from "next/server";
import { isMockMode, proxyToApi } from "@/lib/api-proxy";
import { ensureAppConfigRegistered } from "@/instrumentation";

export const dynamic = "force-dynamic";

const MOCK_QUESTIONS = [
  "Let's start with your **target audience**. Who are you trying to reach? What's their role, industry, and company size?",
  "Great! Now, what **value do you offer** them? What problem do you solve?",
  "Any **urgency** angle we can leverage? Limited-time pricing, upcoming deadlines, seasonal relevance?",
  "What about **scarcity**? Limited spots, exclusive access, waitlist?",
  "What **risk reversal** can you offer? Free trial, money-back guarantee, free consultation?",
  "Finally, what **social proof** do you have? Customer logos, metrics, testimonials?",
];

function mockChatResponse(message: string, sessionId?: string) {
  const mockSessionId = sessionId ?? crypto.randomUUID();
  const encoder = new TextEncoder();

  const questionIndex = sessionId ? Math.min(MOCK_QUESTIONS.length - 1, 2) : 0;
  const isLaterExchange = !!sessionId;

  let reply: string;
  if (!isLaterExchange) {
    reply = `Welcome! I'm your cold email campaign assistant. I'll help you set up a compelling campaign.\n\n${MOCK_QUESTIONS[0]}`;
  } else if (message.toLowerCase().includes("go") || message.toLowerCase().includes("approve")) {
    reply = "Campaign approved! Launching now.";
  } else {
    reply = `Got it! ${MOCK_QUESTIONS[Math.min(questionIndex + 1, MOCK_QUESTIONS.length - 1)]}`;
  }

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ sessionId: mockSessionId })}\n\n`)
      );

      const words = reply.split(" ");
      for (const word of words) {
        await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "token", content: word + " " })}\n\n`)
        );
      }

      controller.enqueue(encoder.encode(`data: "[DONE]"\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, sessionId, context } = body as {
    message: string;
    sessionId?: string;
    context?: Record<string, unknown>;
  };

  if (isMockMode()) {
    return mockChatResponse(message, sessionId);
  }

  // Lazily register chat config on first request
  await ensureAppConfigRegistered();

  const upstream = await proxyToApi("/v1/chat", {
    method: "POST",
    body: {
      message,
      appId: "sales-cold-emails",
      sessionId,
      context,
    },
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "Unknown error");
    return new Response(
      JSON.stringify({ error: "Chat service error", details: text }),
      { status: upstream.status, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
