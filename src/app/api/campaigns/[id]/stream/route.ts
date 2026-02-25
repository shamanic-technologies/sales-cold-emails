import { NextRequest } from "next/server";
import { isMockMode, proxySSE } from "@/lib/api-proxy";
import { MOCK_PROSPECTS, generateMockEmail } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isMockMode()) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < MOCK_PROSPECTS.length; i++) {
          await new Promise((r) =>
            setTimeout(r, 2000 + Math.random() * 2000)
          );

          const prospect = MOCK_PROSPECTS[i];
          const { subject, body } = generateMockEmail(
            prospect.company,
            prospect.person,
            "your-brand"
          );

          const event = {
            type: "lead",
            data: {
              id: `result-${i}`,
              companyName: prospect.company,
              personName: prospect.person,
              personTitle: prospect.title,
              email: prospect.email,
              status: "queued",
              emailSubject: subject,
              emailBody: body,
              timestamp: Date.now(),
            },
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );

          // Simulate status progression
          const statuses = ["researching", "generating", "sending", "sent"];
          for (const status of statuses) {
            await new Promise((r) =>
              setTimeout(r, 800 + Math.random() * 1200)
            );
            const update = {
              type: "lead_update",
              data: { id: `result-${i}`, status },
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
            );
          }

          // Random chance of opened/replied
          if (Math.random() > 0.6) {
            await new Promise((r) =>
              setTimeout(r, 3000 + Math.random() * 3000)
            );
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "lead_update", data: { id: `result-${i}`, status: "opened" } })}\n\n`
              )
            );
            if (Math.random() > 0.7) {
              await new Promise((r) =>
                setTimeout(r, 2000 + Math.random() * 3000)
              );
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "lead_update", data: { id: `result-${i}`, status: "replied" } })}\n\n`
                )
              );
            }
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", data: { campaignId: id } })}\n\n`
          )
        );
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

  // Real mode: proxy upstream SSE
  const upstream = await proxySSE(`/v1/campaigns/${id}/stream`);

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: "Failed to connect to campaign stream" }),
      {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      }
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
