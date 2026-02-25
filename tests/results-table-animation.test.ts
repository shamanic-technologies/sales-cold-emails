import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("results table", () => {
  it("should use framer-motion for row animation", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/results/results-row.tsx"),
      "utf-8"
    );
    expect(content).toContain("motion");
    expect(content).toContain("initial");
    expect(content).toContain("animate");
  });

  it("should use AnimatePresence in results table", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/components/results/results-table.tsx"),
      "utf-8"
    );
    expect(content).toContain("AnimatePresence");
  });

  it("should display email preview panel", () => {
    const content = fs.readFileSync(
      path.join(
        __dirname,
        "../src/components/results/email-preview-panel.tsx"
      ),
      "utf-8"
    );
    expect(content).toContain("emailSubject");
    expect(content).toContain("emailBody");
    expect(content).toContain("selectedResultId");
  });
});
