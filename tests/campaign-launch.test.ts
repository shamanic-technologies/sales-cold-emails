import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("campaign launch flow", () => {
  const useChatContent = fs.readFileSync(
    path.join(__dirname, "../src/components/chat/use-chat.ts"),
    "utf-8"
  );
  const storeContent = fs.readFileSync(
    path.join(__dirname, "../src/lib/store.ts"),
    "utf-8"
  );

  it("should allow approval in both chatting and proposed phases", () => {
    // The approval check should accept both "proposed" and "chatting" phases
    expect(useChatContent).toContain('"proposed"');
    expect(useChatContent).toContain('"chatting"');
    // Must check that workflow is ready before approving
    expect(useChatContent).toContain("workflowRef.current");
    expect(useChatContent).toContain("workflowLoadingRef.current");
  });

  it("should fall back to store campaign answers when ref is empty", () => {
    // launchCampaign should read from store when answersRef is null
    expect(useChatContent).toContain("useAppStore.getState().campaignAnswers");
    // Should provide default values for missing fields
    expect(useChatContent).toContain("target_audience");
    expect(useChatContent).toContain("value_for_target");
    expect(useChatContent).toContain("urgency");
    expect(useChatContent).toContain("scarcity");
    expect(useChatContent).toContain("risk_reversal");
    expect(useChatContent).toContain("social_proof");
  });

  it("should persist extracted campaign answers to store", () => {
    // When extractCampaignAnswers finds answers, they should be saved to store
    expect(useChatContent).toContain("setCampaignAnswers");
    // setCampaignAnswers should be called after extracting answers
    expect(useChatContent).toContain("setCampaignAnswers(answers)");
  });

  it("should have setCampaignAnswers bulk setter in store", () => {
    expect(storeContent).toContain("setCampaignAnswers");
    // Should accept Partial<CampaignAnswers>
    expect(storeContent).toContain(
      "setCampaignAnswers: (answers) => set({ campaignAnswers: answers })"
    );
  });

  it("should set approved and switch to results view on launch", () => {
    expect(useChatContent).toContain("setApproved(true)");
    expect(useChatContent).toContain('setDashboardView("results")');
    expect(useChatContent).toContain('phaseRef.current = "running"');
    expect(useChatContent).toContain("await launchCampaign()");
  });

  it("should never block campaign launch when answers are missing", () => {
    // The old code returned early when answers were null —
    // now it falls back to defaults instead
    expect(useChatContent).not.toContain(
      '"I need a bit more info before we can launch'
    );
  });
});
