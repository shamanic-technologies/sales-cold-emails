import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Webhook } from "svix";

vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn() }));

const SECRET = "whsec_" + Buffer.from("test-secret-0123456789abcdef").toString("base64");

function signedRequest(payload: unknown, secret = SECRET): Request {
  const body = JSON.stringify(payload);
  const id = "msg_test";
  const ts = new Date();
  const signature = new Webhook(secret).sign(id, ts, body);
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    headers: {
      "svix-id": id,
      "svix-timestamp": String(Math.floor(ts.getTime() / 1000)),
      "svix-signature": signature,
    },
    body,
  });
}

describe("Clerk webhook signature (svix v2)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("CLERK_WEBHOOK_SECRET", SECRET);
    vi.stubEnv("POSTMARK_API_KEY", "pm-test");
    fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("accepts a valid signature and parses the event body", async () => {
    const { POST } = await import("../src/app/api/webhooks/clerk/route");
    const res = await POST(
      signedRequest({
        type: "user.created",
        data: { id: "user_1", email_addresses: [{ email_address: "staff@example.com" }], first_name: "Ann" },
      }),
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.To).toBe("staff@example.com");
    expect(sent.HtmlBody).toContain("Hi Ann,");
  });

  it("rejects a payload signed with another secret", async () => {
    const { POST } = await import("../src/app/api/webhooks/clerk/route");
    const other = "whsec_" + Buffer.from("other-secret-0123456789abcd").toString("base64");
    const res = await POST(signedRequest({ type: "user.created", data: { id: "u" } }, other));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
