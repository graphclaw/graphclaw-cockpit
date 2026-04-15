import { useState } from 'react';
import { CytoscapeGraph, type GraphNode, type GraphEdge } from './components/CytoscapeGraph';
import { ViewSwitcher } from './components/ViewSwitcher';
import { TaskTable } from '@/features/tasks/components/TaskTable';
import { useGoals } from './hooks/useGraphData';
import { useGraphEdges } from '@/lib/api-hooks';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'graph' | 'table' | 'dependencies';

export function GoalViewPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { data: goalsData, isLoading } = useGoals();
  const { data: edgesData } = useGraphEdges();

  const goals = goalsData?.items ?? [];

  // Convert goals to graph nodes
  const graphNodes: GraphNode[] = goals.map((g) => ({
    id: g.id,
    label: g.title,
    state: g.state,
    priority: g.priority,
  }));

  // Real edges from API
  const graphEdges: GraphEdge[] = (edgesData?.items ?? []).map((e) => ({
    id: e.edge_id,
    source: e.source_id,
    target: e.target_id,
    edgeType: e.edge_type,
  }));

  const selectedGoal = goals.find((g) => g.id === selectedNodeId);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Goals</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            {goals.length} goal{goals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ViewSwitcher value={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
            </div>
          ) : viewMode === 'graph' ? (
            <CytoscapeGraph
              nodes={graphNodes}
              edges={graphEdges}
              onNodeSelect={setSelectedNodeId}
              onNodeDeselect={() => setSelectedNodeId(null)}
              className="h-[500px]"
            />
          ) : viewMode === 'table' ? (
            <TaskTable />
          ) : (
            <CytoscapeGraph
              nodes={graphNodes}
              edges={graphEdges}
              layout="dagre"
              onNodeSelect={setSelectedNodeId}
              onNodeDeselect={() => setSelectedNodeId(null)}
              className="h-[500px]"
            />
          )}
        </div>

        {/* Detail panel */}
        {selectedGoal && (
          <div className="hidden w-80 shrink-0 overflow-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 lg:block">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)]">{selectedGoal.title}</h3>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">State</span>
                <Badge variant={selectedGoal.state === 'ACTIVE' ? 'active' : 'review'}>
                  {selectedGoal.state}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Priority</span>
                <span className="text-[var(--text-primary)]">{selectedGoal.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">ID</span>
                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                  {selectedGoal.id}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
