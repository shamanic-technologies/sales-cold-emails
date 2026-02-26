import type { ApiDag, ApiDagNode, WorkflowDag, DagNode, DagEdge, DagNodeType } from "./types";

const SERVICE_TYPE_MAP: Record<string, DagNodeType> = {
  apollo: "lead-source",
  lead: "lead-source",
  scraping: "enrichment",
  brand: "enrichment",
  "content-generation": "email-generation",
  chat: "email-generation",
  "email-gateway": "sending",
  instantly: "sending",
  postmark: "sending",
  "reply-qualification": "tracking",
};

function inferNodeType(node: ApiDagNode): DagNodeType {
  const service = (node.config?.service as string) ?? "";
  const path = (node.config?.path as string) ?? "";
  const nodeId = node.id.toLowerCase();

  // Match by service name
  if (SERVICE_TYPE_MAP[service]) return SERVICE_TYPE_MAP[service];

  // Partial match on service name
  for (const [key, type] of Object.entries(SERVICE_TYPE_MAP)) {
    if (service.includes(key)) return type;
  }

  // Heuristics on node ID or path
  if (nodeId.includes("lead") || nodeId.includes("prospect") || nodeId.includes("search")) return "lead-source";
  if (nodeId.includes("enrich") || nodeId.includes("research") || nodeId.includes("scrape")) return "enrichment";
  if (nodeId.includes("email") || nodeId.includes("generate") || nodeId.includes("content")) return "email-generation";
  if (nodeId.includes("send") || nodeId.includes("deliver")) return "sending";
  if (nodeId.includes("track") || nodeId.includes("reply") || nodeId.includes("monitor")) return "tracking";
  if (path.includes("lead") || path.includes("search")) return "lead-source";
  if (path.includes("email") || path.includes("generate")) return "email-generation";
  if (path.includes("send")) return "sending";

  // Fallback by node type
  if (node.type === "condition" || node.type === "wait") return "enrichment";

  return "enrichment";
}

function inferLabel(node: ApiDagNode): string {
  return node.id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function inferDescription(node: ApiDagNode): string {
  const service = (node.config?.service as string) ?? "";
  const method = (node.config?.method as string) ?? "";
  const path = (node.config?.path as string) ?? "";

  if (node.type === "http.call" && service) {
    return `${method.toUpperCase()} ${service}${path}`;
  }
  if (node.type === "condition") return "Conditional branch";
  if (node.type === "wait") return `Wait ${node.config?.seconds ?? ""}s`;
  if (node.type === "for-each") return "Iterate over items";
  return node.type;
}

export function apiDagToWorkflowDag(apiDag: ApiDag): WorkflowDag {
  const rawNodes = Array.isArray(apiDag.nodes) ? apiDag.nodes : [];
  const rawEdges = Array.isArray(apiDag.edges) ? apiDag.edges : [];

  const nodes: DagNode[] = rawNodes.map((n) => ({
    id: n.id,
    type: inferNodeType(n),
    label: inferLabel(n),
    description: inferDescription(n),
    status: "pending" as const,
  }));

  const edges: DagEdge[] = rawEdges.map((e, i) => ({
    id: `e-${i}`,
    source: e.from,
    target: e.to,
  }));

  return { nodes, edges };
}
