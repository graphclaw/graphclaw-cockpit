/**
 * A2ALinkEdge — Purple dotted animated edge from Orchestrator → External Agent (F28).
 *
 * Visual: Purple #A855F7, dotted 2px, animated pulse.
 */
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

export function A2ALinkEdge({
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
          stroke: '#A855F7',
          strokeWidth: 2,
          strokeDasharray: '4 4',
          animation: 'dashdraw 0.8s linear infinite',
          opacity: 0.85,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="nodrag nopan pointer-events-none absolute rounded bg-purple-500/20 px-1 py-0.5 text-[9px] text-purple-300"
        >
          A2A
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
