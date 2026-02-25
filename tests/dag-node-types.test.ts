import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("DAG node types", () => {
  it("should define all required workflow step types", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/types.ts"),
      "utf-8"
    );
    for (const nodeType of [
      "lead-source",
      "enrichment",
      "email-generation",
      "sending",
      "tracking",
    ]) {
      expect(content).toContain(nodeType);
    }
  });

  it("should define all result statuses", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/types.ts"),
      "utf-8"
    );
    for (const status of [
      "queued",
      "researching",
      "generating",
      "sending",
      "sent",
      "opened",
      "replied",
    ]) {
      expect(content).toContain(status);
    }
  });
});
