"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { useAppStore } from "@/lib/store";
import { DagStepNode } from "./dag-node";
import { useDagLayout } from "./use-dag-layout";

export function WorkflowDag() {
  const currentDag = useAppStore((s) => s.currentDag);
  const workflowError = useAppStore((s) => s.workflowError);
  const { nodes, edges } = useDagLayout(currentDag);

  const nodeTypes = useMemo(() => ({ dagStep: DagStepNode }), []);

  if (!currentDag) {
    if (workflowError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-gray-400">
          <div className="text-2xl">&#9888;</div>
          {workflowError}
        </div>
      );
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-gray-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
        Loading your workflow...
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
          nodeColor="#fed7aa"
          maskColor="rgba(255,255,255,0.7)"
          className="!rounded-lg !border !border-gray-200"
        />
      </ReactFlow>
    </div>
  );
}
