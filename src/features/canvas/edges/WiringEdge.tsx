/**
 * WiringEdge — Shared edge for skill/MCP/toolset wiring (F15).
 *
 * Styled by `type` prop in data:
 *   - "skill"     → amber
 *   - "mcp"       → violet
 *   - "tool_set"  → teal
 *   - default     → gray
 */
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

type WiringType = 'skill' | 'mcp' | 'tool_set';

const WIRING_STYLES: Record<WiringType | 'default', { color: string; label: string }> = {
  skill: { color: '#F59E0B', label: 'skill' },
  mcp: { color: '#8B5CF6', label: 'mcp' },
  tool_set: { color: '#14B8A6', label: 'tool' },
  default: { color: '#6B7280', label: '' },
};

export interface WiringEdgeData {
  wiringType?: WiringType;
  label?: string;
}

export function WiringEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const d = data as unknown as WiringEdgeData | undefined;
  const wiringType = d?.wiringType ?? 'default';
  const style = WIRING_STYLES[wiringType as WiringType] ?? WIRING_STYLES.default;
  const displayLabel = d?.label ?? style.label;

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
          stroke: style.color,
          strokeWidth: 2,
          strokeDasharray: '4 2',
          opacity: 0.8,
        }}
      />
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: `${style.color}22`,
              borderColor: `${style.color}44`,
            }}
            className="nodrag nopan pointer-events-none absolute rounded border px-1 py-0.5 text-[9px]"
          >
            <span style={{ color: style.color }}>{displayLabel}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
