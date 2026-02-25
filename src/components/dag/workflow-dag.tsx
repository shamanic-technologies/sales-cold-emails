"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { useAppStore } from "@/lib/store";
import { DagStepNode } from "./dag-node";
import { useDagLayout } from "./use-dag-layout";

export function WorkflowDag() {
  const currentDag = useAppStore((s) => s.currentDag);
  const { nodes, edges } = useDagLayout(currentDag);

  const nodeTypes = useMemo(() => ({ dagStep: DagStepNode }), []);

  if (!currentDag) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Workflow will appear here once proposed.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background gap={20} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor="#c7d2fe"
          maskColor="rgba(255,255,255,0.7)"
          className="!rounded-lg !border !border-gray-200"
        />
      </ReactFlow>
    </div>
  );
}
