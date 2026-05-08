// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// Timeline Hierarchical Gantt — SVG dependency arrows (Wave 4b)
import { type GanttBar } from './types';

interface DependencyEdgeDisplay {
  fromId: string;
  toId: string;
  isBlocking: boolean;
}

interface Props {
  edges: DependencyEdgeDisplay[];
  barMap: Map<string, GanttBar>;
  rowHeight: number;
}

export function TimelineDependencyArrows({ edges, barMap, rowHeight }: Props) {
  const paths: Array<{ d: string; isBlocking: boolean; key: string }> = [];

  for (const edge of edges) {
    const from = barMap.get(edge.fromId);
    const to = barMap.get(edge.toId);
    if (!from || !to) continue;

    // Approximate row index (bars are keyed by rowId which corresponds to visible row order)
    // Use bar left + width for from, bar left for to
    const fromX = from.left + from.width;
    const fromY = rowHeight / 2; // will be offset by SVG transform per edge
    const toX = to.left;
    const toY = rowHeight / 2;

    // Simple bezier: control points offset by ~40px
    const dx = Math.max(Math.abs(toX - fromX) * 0.4, 40);
    const d = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`;
    paths.push({ d, isBlocking: edge.isBlocking, key: `${edge.fromId}-${edge.toId}` });
  }

  if (paths.length === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 10,
      }}
    >
      <defs>
        <marker id="arrow-normal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="var(--border-default)" />
        </marker>
        <marker id="arrow-blocked" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="var(--status-error, #ef4444)" />
        </marker>
      </defs>
      {paths.map(({ d, isBlocking, key }) => (
        <path
          key={key}
          d={d}
          fill="none"
          stroke={isBlocking ? 'var(--status-error, #ef4444)' : 'var(--border-default)'}
          strokeWidth={isBlocking ? 1.5 : 1}
          strokeDasharray={isBlocking ? '4 3' : '4 4'}
          markerEnd={isBlocking ? 'url(#arrow-blocked)' : 'url(#arrow-normal)'}
          opacity={0.75}
        />
      ))}
    </svg>
  );
}
