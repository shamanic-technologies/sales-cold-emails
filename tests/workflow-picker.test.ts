import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("workflow picker", () => {
  const pickerContent = fs.readFileSync(
    path.join(__dirname, "../src/components/workflow/workflow-picker.tsx"),
    "utf-8"
  );
  const storeContent = fs.readFileSync(
    path.join(__dirname, "../src/lib/store.ts"),
    "utf-8"
  );
  const typesContent = fs.readFileSync(
    path.join(__dirname, "../src/lib/types.ts"),
    "utf-8"
  );
  const dashboardContent = fs.readFileSync(
    path.join(__dirname, "../src/app/dashboard/page.tsx"),
    "utf-8"
  );

  it("should render the same columns as performance.mcpfactory.org", () => {
    for (const col of ["% Opens", "% Clicks", "% Replies", "$/Open", "$/Click", "$/Reply"]) {
      expect(pickerContent).toContain(col);
    }
  });

  it("should have editable budget type dropdown with all options", () => {
    for (const opt of ["one-off", "daily", "weekly", "monthly"]) {
      expect(pickerContent).toContain(opt);
    }
    expect(pickerContent).toContain("<select");
    expect(pickerContent).toContain('type="number"');
  });

  it("should have a Launch button that calls launchCampaignFromPicker", () => {
    expect(pickerContent).toContain("launchCampaignFromPicker");
    expect(pickerContent).toContain("Launch");
  });

  it("should show campaign status pill", () => {
    for (const status of ["Ready", "Launching...", "Running", "Completed", "Failed"]) {
      expect(pickerContent).toContain(status);
    }
  });

  it("should compute % and $ metrics from campaignStats", () => {
    expect(pickerContent).toContain("emailsSent");
    expect(pickerContent).toContain("emailsOpened");
    expect(pickerContent).toContain("emailsClicked");
    expect(pickerContent).toContain("emailsReplied");
    expect(pickerContent).toContain("totalCostUsd");
  });

  it("should have campaignStatus in store with all states", () => {
    expect(storeContent).toContain("campaignStatus");
    expect(storeContent).toContain("setCampaignStatus");
    expect(storeContent).toContain('"ready"');
    expect(storeContent).toContain('"launching"');
    expect(storeContent).toContain('"running"');
    expect(storeContent).toContain('"completed"');
    expect(storeContent).toContain('"failed"');
  });

  it("should have setOnboardingBudget action in store", () => {
    expect(storeContent).toContain("setOnboardingBudget");
    expect(storeContent).toContain("budgetType");
    expect(storeContent).toContain("budgetAmount");
  });

  it("should have launchCampaignFromPicker action in store", () => {
    expect(storeContent).toContain("launchCampaignFromPicker");
    expect(storeContent).toContain("createCampaign");
    expect(storeContent).toContain("connectCampaignStream");
  });

  it("should define CampaignStatus type", () => {
    expect(typesContent).toContain("CampaignStatus");
    expect(typesContent).toContain('"ready"');
    expect(typesContent).toContain('"launching"');
  });

  it("should use DashboardView workflow instead of dag", () => {
    expect(typesContent).toContain('"workflow"');
    expect(typesContent).not.toContain('"dag" | "results"');
  });

  it("should render WorkflowPicker in dashboard instead of WorkflowDag", () => {
    expect(dashboardContent).toContain("WorkflowPicker");
    expect(dashboardContent).not.toContain("WorkflowDag");
    expect(dashboardContent).toContain('dashboardView === "workflow"');
  });

  it("should persist campaignStatus in store partialize", () => {
    const partializeMatch = storeContent.match(/partialize[\s\S]*?\}\)/);
    expect(partializeMatch).not.toBeNull();
    expect(partializeMatch![0]).toContain("campaignStatus");
  });
});
