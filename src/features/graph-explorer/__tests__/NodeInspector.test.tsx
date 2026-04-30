/**
 * Unit tests for NodeInspector component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NodeInspector } from '../components/NodeInspector';
import type { TaskNode, ExplorerNode } from '../types';

// Mock mutations
vi.mock('../hooks/useGraphMutations', () => ({
  useUpdateTask: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteTask: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../hooks/useGraphExplorerData', () => ({
  useNodeEdges: () => ({
    data: { items: [] },
    isLoading: false,
  }),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeQC()}>{children}</QueryClientProvider>
  );
}

const sampleTask: TaskNode = {
  kind: 'task',
  id: 'TSK-TEST-0001-ACT',
  title: 'Test Task Title',
  state: 'ACTIVE',
  priority: 'HIGH',
  task_type: 'ATOMIC',
  deadline: '2025-12-31',
  description: 'Test description',
  scoring: {
    timeline_urgency: 0.8,
    dependency_weight: 0.4,
    critical_path: 1.0,
    blocker: 0.0,
    human_override: 0.0,
    resource_risk: 0.2,
    constraint_pressure: 0.1,
    computed_priority: 0.65,
  },
};

describe('NodeInspector', () => {
  it('renders node ID and title', () => {
    const onClose = vi.fn();
    render(
      <NodeInspector
        node={sampleTask}
        allNodes={[sampleTask]}
        allEdges={[]}
        onClose={onClose}
        onNodeDeleted={onClose}
      />,
      { wrapper },
    );
    expect(screen.getByText('TSK-TEST-0001-ACT')).toBeTruthy();
    expect(screen.getByText('Test Task Title')).toBeTruthy();
  });

  it('renders editable title field with correct value', () => {
    render(
      <NodeInspector
        node={sampleTask}
        allNodes={[sampleTask]}
        allEdges={[]}
        onClose={vi.fn()}
        onNodeDeleted={vi.fn()}
      />,
      { wrapper },
    );
    const titleInput = screen.getByTestId('inspector-title') as HTMLInputElement;
    expect(titleInput.value).toBe('Test Task Title');
  });

  it('renders state dropdown with correct value', () => {
    render(
      <NodeInspector
        node={sampleTask}
        allNodes={[sampleTask]}
        allEdges={[]}
        onClose={vi.fn()}
        onNodeDeleted={vi.fn()}
      />,
      { wrapper },
    );
    const stateSelect = screen.getByTestId('inspector-state') as HTMLSelectElement;
    expect(stateSelect.value).toBe('ACTIVE');
  });

  it('Apply Changes button is disabled when no changes made', () => {
    render(
      <NodeInspector
        node={sampleTask}
        allNodes={[sampleTask]}
        allEdges={[]}
        onClose={vi.fn()}
        onNodeDeleted={vi.fn()}
      />,
      { wrapper },
    );
    const applyBtn = screen.getByTestId('inspector-apply') as HTMLButtonElement;
    expect(applyBtn.disabled).toBe(true);
  });

  it('Apply Changes button enables after editing title', async () => {
    render(
      <NodeInspector
        node={sampleTask}
        allNodes={[sampleTask]}
        allEdges={[]}
        onClose={vi.fn()}
        onNodeDeleted={vi.fn()}
      />,
      { wrapper },
    );
    const titleInput = screen.getByTestId('inspector-title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    await waitFor(() => {
      const applyBtn = screen.getByTestId('inspector-apply') as HTMLButtonElement;
      expect(applyBtn.disabled).toBe(false);
    });
  });

  it('renders scoring grid for task with scoring', () => {
    render(
      <NodeInspector
        node={sampleTask}
        allNodes={[sampleTask]}
        allEdges={[]}
        onClose={vi.fn()}
        onNodeDeleted={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Priority Scoring')).toBeTruthy();
    expect(screen.getByText('0.650')).toBeTruthy();
  });

  it('renders kind badge', () => {
    render(
      <NodeInspector
        node={sampleTask}
        allNodes={[sampleTask]}
        allEdges={[]}
        onClose={vi.fn()}
        onNodeDeleted={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('task')).toBeTruthy();
  });

  it('close button calls onClose', () => {
    const onClose = vi.fn();
    render(
      <NodeInspector
        node={sampleTask}
        allNodes={[sampleTask]}
        allEdges={[]}
        onClose={onClose}
        onNodeDeleted={vi.fn()}
      />,
      { wrapper },
    );
    fireEvent.click(screen.getByTestId('inspector-close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('delete button shows confirmation', () => {
    render(
      <NodeInspector
        node={sampleTask}
        allNodes={[sampleTask]}
        allEdges={[]}
        onClose={vi.fn()}
        onNodeDeleted={vi.fn()}
      />,
      { wrapper },
    );
    fireEvent.click(screen.getByTestId('inspector-delete'));
    expect(screen.getByTestId('inspector-delete-confirm')).toBeTruthy();
  });

  it('renders resource node (read-only fields)', () => {
    const resourceNode: ExplorerNode = {
      kind: 'resource',
      id: 'RES-001',
      name: 'Alice Smith',
      resource_type: 'HUMAN',
      reliability: 0.9,
    };
    render(
      <NodeInspector
        node={resourceNode}
        allNodes={[resourceNode]}
        allEdges={[]}
        onClose={vi.fn()}
        onNodeDeleted={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Alice Smith')).toBeTruthy();
    expect(screen.getByText('HUMAN')).toBeTruthy();
    expect(screen.getByText('90%')).toBeTruthy();
  });
});
