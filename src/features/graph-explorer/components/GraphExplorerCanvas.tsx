/**
 * Graph Explorer — Cytoscape.js canvas with multi-type node shapes,
 * edge styling by type, client-side filtering, layouts, and minimap.
 */

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
// @ts-expect-error — cytoscape-dagre lacks types
import dagre from 'cytoscape-dagre';

import type { ExplorerNode, ExplorerEdge, GraphExplorerFilters, LayoutName } from '../types';
import { EDGE_TYPE_CONFIG } from '../types';

cytoscape.use(dagre);

// ── CSS variable resolver ────────────────────────────────────────────────────
// Cytoscape cannot use CSS vars directly; resolve them at runtime.
function resolveCssVar(varName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const clean = varName.trim().replace(/^var\(/, '').replace(/\)$/, '').trim();
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(clean)
    .trim();
  return val || fallback;
}

// ── State → color mapping ────────────────────────────────────────────────────
const TASK_STATE_VAR: Record<string, [string, string]> = {
  ACTIVE: ['--state-active', '#3b82f6'],
  IN_PROGRESS: ['--state-progress', '#10b981'],
  BLOCKED: ['--state-blocked', '#ef4444'],
  DELAYED: ['--state-delayed', '#f59e0b'],
  DONE: ['--state-complete', '#9ca3af'],
  COMPLETE: ['--state-complete', '#9ca3af'],
  NEEDS_REVIEW: ['--state-review', '#a855f7'],
  PLANNING: ['--state-review', '#a855f7'],
  BACKLOG: ['--text-tertiary', '#94a3b8'],
  SNOOZED: ['--state-snoozed', '#e5e7eb'],
  PENDING: ['--text-tertiary', '#94a3b8'],
  CANCELLED: ['--state-blocked', '#ef4444'],
  INACTIVE_PENDING: ['--text-tertiary', '#94a3b8'],
};

function getTaskColor(state: string): string {
  const [varName, fallback] = TASK_STATE_VAR[state] ?? ['--text-tertiary', '#94a3b8'];
  return resolveCssVar(varName, fallback);
}

function getPrioritySize(priority: string): number {
  switch (priority) {
    case 'CRITICAL': return 64;
    case 'HIGH': return 54;
    case 'MEDIUM': return 44;
    case 'LOW': return 38;
    default: return 44;
  }
}

// ── Element conversion ────────────────────────────────────────────────────────

function nodeToElement(node: ExplorerNode): ElementDefinition {
  switch (node.kind) {
    case 'task': {
      const color = getTaskColor(node.state);
      return {
        data: {
          id: node.id,
          label: node.title.length > 22 ? node.title.slice(0, 20) + '…' : node.title,
          kind: 'task',
          state: node.state,
          priority: node.priority,
          shape: 'round-rectangle',
          bgColor: color,
          borderColor: color,
          size: getPrioritySize(node.priority),
        },
      };
    }
    case 'goal': {
      const color = resolveCssVar('--state-progress', '#10b981');
      return {
        data: {
          id: node.id,
          label: node.title.length > 18 ? node.title.slice(0, 16) + '…' : node.title,
          kind: 'goal',
          state: node.state,
          shape: 'diamond',
          bgColor: color,
          borderColor: color,
          size: 58,
        },
      };
    }
    case 'resource': {
      return {
        data: {
          id: node.id,
          label: node.name.length > 18 ? node.name.slice(0, 16) + '…' : node.name,
          kind: 'resource',
          shape: 'ellipse',
          bgColor: '#06b6d4',
          borderColor: '#0891b2',
          size: 48,
        },
      };
    }
    case 'constraint': {
      const color = resolveCssVar('--state-delayed', '#f59e0b');
      return {
        data: {
          id: node.id,
          label: node.title.length > 18 ? node.title.slice(0, 16) + '…' : node.title,
          kind: 'constraint',
          shape: 'hexagon',
          bgColor: color,
          borderColor: color,
          size: 48,
        },
      };
    }
  }
}

function edgeToElement(edge: ExplorerEdge): ElementDefinition {
  const cfg = EDGE_TYPE_CONFIG[edge.edge_type] ?? {
    color: '#94a3b8',
    lineStyle: 'solid',
    width: 1.5,
  };
  return {
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      edge_type: edge.edge_type,
      lineColor: cfg.color,
      lineStyle: cfg.lineStyle,
      lineWidth: cfg.width,
    },
  };
}

// ── Cytoscape stylesheet ──────────────────────────────────────────────────────

function buildStylesheet(): cytoscape.StylesheetStyle[] {
  return [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '10px',
        'font-family': 'Inter, system-ui, sans-serif',
        color: '#fff',
        'text-wrap': 'ellipsis',
        'text-max-width': '90px',
        width: 'data(size)',
        height: 'data(size)',
        'background-color': 'data(bgColor)',
        'border-width': 2,
        'border-color': 'data(borderColor)',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shape: 'data(shape)' as any,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': resolveCssVar('--brand-primary', '#0ea5e9'),
        'overlay-opacity': 0.12,
        'overlay-color': resolveCssVar('--brand-primary', '#0ea5e9'),
      },
    },
    {
      selector: 'node.hidden',
      style: { display: 'none' },
    },
    {
      selector: 'edge',
      style: {
        width: 'data(lineWidth)',
        'line-color': 'data(lineColor)',
        'target-arrow-color': 'data(lineColor)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.85,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'line-style': 'data(lineStyle)' as any,
      },
    },
    {
      selector: 'edge:selected',
      style: {
        width: 4,
        'line-color': resolveCssVar('--brand-primary', '#0ea5e9'),
        'target-arrow-color': resolveCssVar('--brand-primary', '#0ea5e9'),
        'overlay-opacity': 0.15,
        'overlay-color': resolveCssVar('--brand-primary', '#0ea5e9'),
      },
    },
    {
      selector: 'edge.hidden',
      style: { display: 'none' },
    },
  ];
}

// ── Filter application ────────────────────────────────────────────────────────

function applyFilters(cy: Core, nodes: ExplorerNode[], filters: GraphExplorerFilters) {
  const now = Date.now();
  const endOfWeek = now + 7 * 24 * 60 * 60 * 1000;
  const endOfMonth = now + 30 * 24 * 60 * 60 * 1000;

  // Build set of visible node IDs
  const visibleIds = new Set<string>();

  for (const node of nodes) {
    let visible = true;

    if (node.kind === 'task') {
      if (!filters.showTasks) { visible = false; }
      else if (filters.taskStates.size > 0 && !filters.taskStates.has(node.state as never)) {
        visible = false;
      } else if (filters.taskTypes.size > 0 && !filters.taskTypes.has(node.task_type as never)) {
        visible = false;
      } else if (filters.priorities.size > 0 && !filters.priorities.has(node.priority as never)) {
        visible = false;
      } else if (filters.onCriticalPath && !node.on_critical_path) {
        visible = false;
      } else if (filters.overdueOnly) {
        if (!node.deadline) { visible = false; }
        else if (new Date(node.deadline).getTime() >= now) { visible = false; }
      } else if (filters.dueThisWeek) {
        if (!node.deadline) { visible = false; }
        else {
          const dl = new Date(node.deadline).getTime();
          if (dl < now || dl > endOfWeek) visible = false;
        }
      } else if (filters.dueThisMonth) {
        if (!node.deadline) { visible = false; }
        else {
          const dl = new Date(node.deadline).getTime();
          if (dl < now || dl > endOfMonth) visible = false;
        }
      } else if (filters.noDeadline && node.deadline) {
        visible = false;
      }
    } else if (node.kind === 'goal') {
      if (!filters.showGoals) { visible = false; }
      else if (filters.goalStates.size > 0 && !filters.goalStates.has(node.state as never)) {
        visible = false;
      }
    } else if (node.kind === 'resource') {
      if (!filters.showResources) visible = false;
    } else if (node.kind === 'constraint') {
      if (!filters.showConstraints) visible = false;
    }

    if (visible) visibleIds.add(node.id);
  }

  // Apply to Cytoscape
  cy.nodes().forEach((cyNode) => {
    const id = cyNode.id();
    if (visibleIds.has(id)) {
      cyNode.removeClass('hidden');
    } else {
      cyNode.addClass('hidden');
    }
  });

  // Hide edges if either endpoint is hidden or edge_type filtered
  cy.edges().forEach((e) => {
    const srcVisible = visibleIds.has(e.source().id());
    const tgtVisible = visibleIds.has(e.target().id());
    const typeOk = filters.edgeTypes.size === 0 || filters.edgeTypes.has(e.data('edge_type') as string);
    if (srcVisible && tgtVisible && typeOk) {
      e.removeClass('hidden');
    } else {
      e.addClass('hidden');
    }
  });
}

// ── Canvas ref handle ─────────────────────────────────────────────────────────

export interface GraphExplorerCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  getZoomPercent: () => number;
  runLayout: (name: LayoutName) => void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  nodes: ExplorerNode[];
  edges: ExplorerEdge[];
  filters: GraphExplorerFilters;
  layout: LayoutName;
  showLabels: boolean;
  onNodeSelect: (id: string) => void;
  onEdgeSelect: (id: string) => void;
  onDeselect: () => void;
  onZoomChange?: (percent: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const GraphExplorerCanvas = forwardRef<GraphExplorerCanvasHandle, Props>(
  function GraphExplorerCanvas(
    { nodes, edges, filters, layout, showLabels, onNodeSelect, onEdgeSelect, onDeselect, onZoomChange },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);

    // ── Stable callbacks ─────────────────────────────────────────────────────
    const stableNodeSelect = useCallback(onNodeSelect, [onNodeSelect]);
    const stableEdgeSelect = useCallback(onEdgeSelect, [onEdgeSelect]);
    const stableDeselect = useCallback(onDeselect, [onDeselect]);

    // ── Imperative handle ────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      zoomIn() {
        cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
        cyRef.current?.center();
      },
      zoomOut() {
        cyRef.current?.zoom(cyRef.current.zoom() / 1.2);
        cyRef.current?.center();
      },
      fit() {
        cyRef.current?.fit(undefined, 30);
      },
      getZoomPercent() {
        return Math.round((cyRef.current?.zoom() ?? 1) * 100);
      },
      runLayout(name: LayoutName) {
        if (!cyRef.current) return;
        cyRef.current.layout(buildLayoutOptions(name)).run();
      },
    }));

    // ── Build Cytoscape on mount / when data changes ──────────────────────────
    useEffect(() => {
      if (!containerRef.current) return;

      const elements: ElementDefinition[] = [
        ...nodes.map(nodeToElement),
        ...edges
          .filter((e) => nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target))
          .map(edgeToElement),
      ];

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: buildStylesheet(),
        layout: buildLayoutOptions(layout),
        minZoom: 0.15,
        maxZoom: 4,
        wheelSensitivity: 0.25,
        boxSelectionEnabled: false,
        autounselectify: false,
      });

      // Apply initial filters
      applyFilters(cy, nodes, filters);

      // Events
      cy.on('select', 'node', (e) => {
        stableNodeSelect(e.target.id() as string);
      });
      cy.on('select', 'edge', (e) => {
        stableEdgeSelect(e.target.id() as string);
      });
      cy.on('unselect', () => {
        stableDeselect();
      });
      cy.on('tap', (e) => {
        if (e.target === cy) stableDeselect();
      });
      cy.on('zoom', () => {
        onZoomChange?.(Math.round(cy.zoom() * 100));
      });

      cyRef.current = cy;

      return () => {
        cy.destroy();
        cyRef.current = null;
      };
      // Re-create when data changes (nodes/edges/layout).
      // Filters & labels applied via separate effects below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges, layout, stableNodeSelect, stableEdgeSelect, stableDeselect]);

    // ── Apply filters on change (client-side, no re-mount) ───────────────────
    useEffect(() => {
      const cy = cyRef.current;
      if (!cy) return;
      applyFilters(cy, nodes, filters);
    }, [filters, nodes]);

    // ── Toggle labels ────────────────────────────────────────────────────────
    useEffect(() => {
      const cy = cyRef.current;
      if (!cy) return;
      cy.style()
        .selector('node')
        .style('label', showLabels ? 'data(label)' : '')
        .update();
    }, [showLabels]);

    return (
      <div
        ref={containerRef}
        data-testid="graph-explorer-canvas"
        className="h-full w-full"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    );
  },
);

function buildLayoutOptions(name: LayoutName): cytoscape.LayoutOptions {
  switch (name) {
    case 'dagre':
      return {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 60,
        rankSep: 100,
        padding: 40,
      } as cytoscape.LayoutOptions;
    case 'cose':
      return { name: 'cose', padding: 40, nodeRepulsion: 8000 } as cytoscape.LayoutOptions;
    case 'breadthfirst':
      return { name: 'breadthfirst', padding: 40, spacingFactor: 1.2 } as cytoscape.LayoutOptions;
    case 'concentric':
      return { name: 'concentric', padding: 40, minNodeSpacing: 50 } as cytoscape.LayoutOptions;
    case 'circle':
      return { name: 'circle', padding: 40 } as cytoscape.LayoutOptions;
    case 'grid':
      return { name: 'grid', padding: 40, spacingFactor: 1.2 } as cytoscape.LayoutOptions;
    default:
      return { name: 'dagre' } as cytoscape.LayoutOptions;
  }
}
