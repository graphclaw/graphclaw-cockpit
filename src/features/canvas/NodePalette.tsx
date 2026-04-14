import { Cpu, GitFork, Split, ArrowRightLeft, HardDrive, Repeat, UserCheck, Bot, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NodeType {
  type: string;
  label: string;
  icon: LucideIcon;
}

const NODE_TYPES: NodeType[] = [
  { type: 'input', label: 'Input', icon: ArrowRightLeft },
  { type: 'llm-call', label: 'LLM Call', icon: Cpu },
  { type: 'tool-call', label: 'Tool Call', icon: Wand2 },
  { type: 'condition', label: 'Condition', icon: Split },
  { type: 'loop', label: 'Loop', icon: Repeat },
  { type: 'human-gate', label: 'Human Gate', icon: UserCheck },
  { type: 'sub-agent', label: 'Sub-Agent', icon: Bot },
  { type: 'transform', label: 'Transform', icon: GitFork },
  { type: 'output', label: 'Output', icon: HardDrive },
];

interface NodePaletteProps {
  onAddNode: (type: string, label: string) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="hidden w-48 shrink-0 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 lg:block">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        Node Palette
      </h3>
      <div className="space-y-1">
        {NODE_TYPES.map((node) => (
          <button
            key={node.type}
            onClick={() => onAddNode(node.type, node.label)}
            className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] transition-colors"
          >
            <node.icon size={14} />
            <span>{node.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
