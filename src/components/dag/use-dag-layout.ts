"use client";

import { useMemo } from "react";
import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "reactflow";
import type { WorkflowDag } from "@/lib/types";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 100;

export function useDagLayout(dag: WorkflowDag | null) {
  return useMemo(() => {
    if (!dag) return { nodes: [], edges: [] };

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });

    dag.nodes.forEach((node) => {
      g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    dag.edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const nodes: Node[] = dag.nodes.map((node) => {
      const pos = g.node(node.id);
      return {
        id: node.id,
        type: "dagStep",
        position: {
          x: pos.x - NODE_WIDTH / 2,
          y: pos.y - NODE_HEIGHT / 2,
        },
        data: {
          label: node.label,
          description: node.description,
          nodeType: node.type,
          status: node.status,
        },
      };
    });

    const edges: Edge[] = dag.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: "#a5b4fc", strokeWidth: 2 },
    }));

    return { nodes, edges };
  }, [dag]);
}
