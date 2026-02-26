import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("workflow regeneration from chat", () => {
  const useChatContent = fs.readFileSync(
    path.join(__dirname, "../src/components/chat/use-chat.ts"),
    "utf-8"
  );

  it("should have extractWorkflowHint function", () => {
    expect(useChatContent).toContain("function extractWorkflowHint(text: string): string | null");
    expect(useChatContent).toContain("workflow_hint");
  });

  it("should have stripHiddenBlocks function that strips both block types", () => {
    expect(useChatContent).toContain("function stripHiddenBlocks(text: string): string");
    expect(useChatContent).toContain("campaign_answers");
    expect(useChatContent).toContain("workflow_hint");
  });

  it("should have regenerateWorkflow callback that calls generateWorkflow", () => {
    expect(useChatContent).toContain("regenerateWorkflow");
    expect(useChatContent).toContain("generateWorkflow(description)");
    expect(useChatContent).toContain("Regenerating your workflow based on your changes");
  });

  it("should extract workflow_hint after streaming and trigger regeneration", () => {
    expect(useChatContent).toContain("extractWorkflowHint(accumulated)");
    expect(useChatContent).toContain("await regenerateWorkflow(workflowHint)");
  });

  it("should strip workflow_hint blocks from display using stripHiddenBlocks", () => {
    expect(useChatContent).toContain("stripHiddenBlocks(accumulated)");
    // Should NOT use old stripCampaignAnswersBlock for display
    expect(useChatContent).not.toMatch(/stripCampaignAnswersBlock\(accumulated\)/);
  });

  it("should update workflowRef, setWorkflowResponse, and setDag on regeneration", () => {
    expect(useChatContent).toContain("workflowRef.current = resp");
    expect(useChatContent).toContain("setWorkflowResponse(resp)");
    expect(useChatContent).toContain("apiDagToWorkflowDag(resp.dag)");
    expect(useChatContent).toContain("setDag(dag)");
  });

  it("should handle regeneration failure gracefully", () => {
    expect(useChatContent).toContain("Workflow regeneration failed:");
    expect(useChatContent).toContain("Failed to update the workflow. You can try again or launch with the current one.");
  });
});
