import { useEffect, useRef, useCallback } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
// @ts-expect-error — cytoscape-dagre doesn't have proper types
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

const STATE_COLORS: Record<string, string> = {
  ACTIVE: 'var(--state-active)',
  IN_PROGRESS: 'var(--state-progress)',
  BLOCKED: 'var(--state-blocked)',
  DELAYED: 'var(--state-delayed)',
  DONE: 'var(--state-complete)',
  PLANNING: 'var(--state-review)',
  BACKLOG: 'var(--text-tertiary)',
  SNOOZED: 'var(--state-snoozed)',
};

const DEFAULT_STYLESHEET: Array<{ selector: string; style: Record<string, unknown> }> = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '11px',
      'font-family': 'Inter, sans-serif',
      color: '#fff',
      'text-wrap': 'ellipsis',
      'text-max-width': '100px',
      width: 'data(size)',
      height: 'data(size)',
      'background-color': 'data(color)',
      'border-width': 2,
      'border-color': 'data(borderColor)',
      shape: 'round-rectangle',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 3,
      'border-color': '#7C3AED',
      'overlay-opacity': 0.1,
      'overlay-color': '#7C3AED',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#94A3B8',
      'target-arrow-color': '#94A3B8',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 0.8,
    },
  },
  {
    selector: 'edge[edgeType="dependency"]',
    style: {
      'line-style': 'dashed',
      'line-color': '#EF4444',
      'target-arrow-color': '#EF4444',
    },
  },
  {
    selector: 'edge[edgeType="subtask"]',
    style: {
      'line-color': '#3B82F6',
      'target-arrow-color': '#3B82F6',
    },
  },
];

export interface GraphNode {
  id: string;
  label: string;
  state: string;
  priority?: string;
  type?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  edgeType?: string;
}

interface CytoscapeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout?: string;
  onNodeSelect?: (nodeId: string) => void;
  onNodeDeselect?: () => void;
  className?: string;
}

function getNodeSize(priority?: string): number {
  switch (priority) {
    case 'CRITICAL':
      return 60;
    case 'HIGH':
      return 50;
    case 'MEDIUM':
      return 40;
    case 'LOW':
      return 35;
    default:
      return 40;
  }
}

function toElements(nodes: GraphNode[], edges: GraphEdge[]): ElementDefinition[] {
  const nodeElements: ElementDefinition[] = nodes
    .filter((n) => !!n.id)
    .map((n) => ({
      data: {
        id: n.id,
        label: n.label,
        color: STATE_COLORS[n.state] ?? STATE_COLORS.BACKLOG,
        borderColor: STATE_COLORS[n.state] ?? STATE_COLORS.BACKLOG,
        size: getNodeSize(n.priority),
      },
    }));

  const edgeElements: ElementDefinition[] = edges
    .filter((e) => !!e.id && !!e.source && !!e.target)
    .map((e) => ({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        edgeType: e.edgeType ?? 'subtask',
      },
    }));

  return [...nodeElements, ...edgeElements];
}

export function CytoscapeGraph({
  nodes,
  edges,
  layout = 'dagre',
  onNodeSelect,
  onNodeDeselect,
  className,
}: CytoscapeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const handleSelect = useCallback(
    (e: cytoscape.EventObject) => {
      const nodeId = e.target.id() as string;
      onNodeSelect?.(nodeId);
    },
    [onNodeSelect],
  );

  const handleDeselect = useCallback(() => {
    onNodeDeselect?.();
  }, [onNodeDeselect]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: toElements(nodes, edges),
      style: DEFAULT_STYLESHEET,
      layout: {
        name: layout,
        // dagre options
        rankDir: 'TB',
        nodeSep: 50,
        rankSep: 80,
        padding: 30,
      } as cytoscape.LayoutOptions,
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    cy.on('select', 'node', handleSelect);
    cy.on('unselect', 'node', handleDeselect);

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [nodes, edges, layout, handleSelect, handleDeselect]);

  return (
    <div
      ref={containerRef}
      className={`w-full border border-[var(--border-default)] rounded-[var(--radius-lg)] bg-[var(--bg-inset)] ${className ?? ''}`}
      style={{ minHeight: 400 }}
      data-testid="cytoscape-graph"
    />
  );
}
