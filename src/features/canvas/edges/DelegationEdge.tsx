/**
 * DelegationEdge — Animated cyan edge from Orchestrator → Sub-Agent (F6).
 */
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

export function DelegationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#0EA5E9',
          strokeWidth: 2.5,
          strokeDasharray: '6 3',
          animation: 'dashdraw 0.6s linear infinite',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="nodrag nopan pointer-events-none absolute rounded bg-sky-500/20 px-1 py-0.5 text-[9px] text-sky-300"
        >
          delegates
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
