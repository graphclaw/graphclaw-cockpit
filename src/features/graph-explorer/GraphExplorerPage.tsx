/**
 * Graph Explorer — main three-panel page.
 *
 * Layout: [Filter Panel 260px] | [Canvas flex-1] | [Inspector 300px]
 * Header has stats bar. Canvas has floating toolbar + zoom controls.
 */

import { useRef, useState, useCallback } from 'react';
import { PanelLeftClose, PanelLeft, RefreshCw, Network } from 'lucide-react';
import { Toaster } from 'sonner';

import { useGraphExplorerStore } from './hooks/useGraphExplorerStore';
import { useGraphExplorerData } from './hooks/useGraphExplorerData';

import { GraphExplorerCanvas, type GraphExplorerCanvasHandle } from './components/GraphExplorerCanvas';
import { GraphExplorerToolbar } from './components/GraphExplorerToolbar';
import { ZoomControls } from './components/ZoomControls';
import { GraphFilterPanel } from './components/GraphFilterPanel';
import { NodeInspector } from './components/NodeInspector';
import { EdgeInspector } from './components/EdgeInspector';
import { AddNodeDialog } from './components/AddNodeDialog';
import { AddEdgeDialog } from './components/AddEdgeDialog';

import type { ExplorerNode, ExplorerEdge, LayoutName, InteractionMode } from './types';

export function GraphExplorerPage() {
  const canvasRef = useRef<GraphExplorerCanvasHandle>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [showLabels, setShowLabels] = useState(true);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [addEdgeOpen, setAddEdgeOpen] = useState(false);

  // ── Store ─────────────────────────────────────────────────────────────────
  const {
    filterPanelOpen,
    toggleFilterPanel,
    layout,
    setLayout,
    mode,
    setMode,
    selection,
    setSelection,
    clearSelection,
    filters,
  } = useGraphExplorerStore();

  // ── Data ──────────────────────────────────────────────────────────────────
  const { nodes, edges, stats, isLoading, isError, error, refetch } = useGraphExplorerData();

  // ── Selection helpers ─────────────────────────────────────────────────────
  const selectedNode: ExplorerNode | null =
    selection?.kind === 'node'
      ? (nodes.find((n) => n.id === selection.id) ?? null)
      : null;

  const selectedEdge: ExplorerEdge | null =
    selection?.kind === 'edge'
      ? (edges.find((e) => e.id === selection.id) ?? null)
      : null;

  const handleNodeSelect = useCallback(
    (id: string) => setSelection({ kind: 'node', id }),
    [setSelection],
  );

  const handleEdgeSelect = useCallback(
    (id: string) => setSelection({ kind: 'edge', id }),
    [setSelection],
  );

  // ── Toolbar handlers ──────────────────────────────────────────────────────
  const handleLayoutChange = (newLayout: LayoutName) => {
    setLayout(newLayout);
    canvasRef.current?.runLayout(newLayout);
  };

  const handleFit = () => {
    canvasRef.current?.fit();
    setZoomPercent(canvasRef.current?.getZoomPercent() ?? 100);
  };

  const handleZoomIn = () => {
    canvasRef.current?.zoomIn();
    setZoomPercent(canvasRef.current?.getZoomPercent() ?? 100);
  };

  const handleZoomOut = () => {
    canvasRef.current?.zoomOut();
    setZoomPercent(canvasRef.current?.getZoomPercent() ?? 100);
  };

  // ── Visible stats (approximate — based on filter activity) ────────────────
  const visibleNodes = stats.totalNodes;
  const visibleEdges = stats.totalEdges;

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-[var(--bg-page)]"
      data-testid="graph-explorer-page"
    >
      <Toaster richColors position="bottom-right" />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Filter toggle */}
          <button
            onClick={toggleFilterPanel}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] transition-colors"
            title={filterPanelOpen ? 'Collapse filter panel' : 'Expand filter panel'}
            data-testid="toggle-filter-panel"
          >
            {filterPanelOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>

          <div className="flex items-center gap-2">
            <Network size={18} className="text-[var(--brand-primary)]" />
            <h1 className="text-base font-semibold text-[var(--text-primary)]">Graph Explorer</h1>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="flex items-center gap-4 text-xs text-[var(--text-secondary)]"
          data-testid="stats-bar"
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
              <span>Loading graph…</span>
            </div>
          ) : isError ? (
            <span className="text-[var(--state-blocked)]">
              Failed to load: {error?.message ?? 'Unknown error'}
            </span>
          ) : (
            <>
              <StatBadge label="Nodes" count={visibleNodes} data-testid="stat-nodes" />
              <StatBadge label="Tasks" count={stats.taskCount} data-testid="stat-tasks" />
              <StatBadge label="Goals" count={stats.goalCount} data-testid="stat-goals" />
              <StatBadge label="Resources" count={stats.resourceCount} data-testid="stat-resources" />
              <StatBadge label="Edges" count={visibleEdges} data-testid="stat-edges" />
            </>
          )}

          <button
            onClick={refetch}
            className="rounded p-1 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors"
            title="Refresh"
            data-testid="refresh-button"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Filter panel */}
        {filterPanelOpen && (
          <div
            className="shrink-0 overflow-hidden border-r border-[var(--border-default)] bg-[var(--bg-surface)]"
            style={{ width: 260 }}
            data-testid="filter-panel-container"
          >
            <GraphFilterPanel />
          </div>
        )}

        {/* Canvas area */}
        <div className="relative min-w-0 flex-1">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg-page)]/80">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
                <span className="text-sm text-[var(--text-secondary)]">Loading graph…</span>
              </div>
            </div>
          )}

          {!isLoading && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Network size={40} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
                <p className="text-sm font-medium text-[var(--text-secondary)]">No nodes in graph</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Create tasks and goals to see them here.
                </p>
                <button
                  onClick={() => setAddNodeOpen(true)}
                  className="mt-3 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--brand-primary-hover)] transition-colors"
                >
                  Add Node
                </button>
              </div>
            </div>
          )}

          {/* Floating toolbar */}
          {!isLoading && nodes.length > 0 && (
            <GraphExplorerToolbar
              mode={mode as InteractionMode}
              onModeChange={setMode}
              layout={layout}
              onLayoutChange={handleLayoutChange}
              showLabels={showLabels}
              onToggleLabels={() => setShowLabels((v) => !v)}
              onAddNode={() => setAddNodeOpen(true)}
              onAddEdge={() => setAddEdgeOpen(true)}
              onFit={handleFit}
              onRefresh={refetch}
            />
          )}

          {/* Cytoscape canvas */}
          <GraphExplorerCanvas
            ref={canvasRef}
            nodes={nodes}
            edges={edges}
            filters={filters}
            layout={layout}
            showLabels={showLabels}
            onNodeSelect={handleNodeSelect}
            onEdgeSelect={handleEdgeSelect}
            onDeselect={clearSelection}
            onZoomChange={setZoomPercent}
          />

          {/* Zoom controls */}
          {!isLoading && nodes.length > 0 && (
            <ZoomControls
              zoomPercent={zoomPercent}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFit={handleFit}
            />
          )}
        </div>

        {/* Inspector panel */}
        {(selectedNode ?? selectedEdge) && (
          <div
            className="shrink-0 overflow-hidden border-l border-[var(--border-default)] bg-[var(--bg-surface)]"
            style={{ width: 300 }}
            data-testid="inspector-panel"
          >
            {selectedNode && (
              <NodeInspector
                node={selectedNode}
                allNodes={nodes}
                allEdges={edges}
                onClose={clearSelection}
                onNodeDeleted={clearSelection}
              />
            )}
            {selectedEdge && !selectedNode && (
              <EdgeInspector
                edge={selectedEdge}
                allNodes={nodes}
                onClose={clearSelection}
                onEdgeDeleted={clearSelection}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      <AddNodeDialog
        open={addNodeOpen}
        onClose={() => setAddNodeOpen(false)}
        onNodeCreated={() => setAddNodeOpen(false)}
      />
      <AddEdgeDialog
        open={addEdgeOpen}
        nodes={nodes}
        onClose={() => setAddEdgeOpen(false)}
        onEdgeCreated={() => setAddEdgeOpen(false)}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBadge({
  label,
  count,
  'data-testid': testId,
}: {
  label: string;
  count: number;
  'data-testid'?: string;
}) {
  return (
    <span className="flex items-center gap-1" data-testid={testId}>
      <span className="font-semibold text-[var(--text-primary)]">{count}</span>
      <span>{label}</span>
    </span>
  );
}
