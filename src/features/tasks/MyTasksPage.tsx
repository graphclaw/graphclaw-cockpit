// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { TaskTable } from './components/TaskTable';
import { useTasks } from '@/features/graph/hooks/useGraphData';
import { TaskDetail } from './components/TaskDetail';

export function MyTasksPage() {
  const { data } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = data?.items.find((t) => t.id === selectedTaskId);

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">My Tasks</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            {data?.total ?? 0} task{(data?.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <TaskTable />
      </div>

      {selectedTask && (
        <div className="hidden w-80 shrink-0 lg:block">
          <TaskDetail task={selectedTask} onClose={() => setSelectedTaskId(null)} />
        </div>
      )}
    </div>
  );
}
