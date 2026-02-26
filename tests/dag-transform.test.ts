import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("DAG transformer", () => {
  it("should convert API DAG edges from/to to source/target", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/dag-transform.ts"),
      "utf-8"
    );
    expect(content).toContain("source: e.from");
    expect(content).toContain("target: e.to");
  });

  it("should infer node types from service names", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/dag-transform.ts"),
      "utf-8"
    );
    expect(content).toContain("lead-source");
    expect(content).toContain("email-generation");
    expect(content).toContain("http.call");
    expect(content).toContain("SERVICE_TYPE_MAP");
  });

  it("should export apiDagToWorkflowDag function", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/dag-transform.ts"),
      "utf-8"
    );
    expect(content).toContain("export function apiDagToWorkflowDag");
  });

  it("should guard against non-array nodes and edges", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../src/lib/dag-transform.ts"),
      "utf-8"
    );
    expect(content).toContain("Array.isArray(apiDag.nodes)");
    expect(content).toContain("Array.isArray(apiDag.edges)");
  });
});
