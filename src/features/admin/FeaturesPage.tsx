import { useState } from 'react';

interface FeatureGate {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: 'all' | 'admins' | 'selected';
}

const MOCK_GATES: FeatureGate[] = [
  { id: 'fg-1', name: 'MCP Connectors', description: 'Enable MCP server integrations', enabled: true, scope: 'all' },
  { id: 'fg-2', name: 'Canvas Editor', description: 'Visual agent workflow builder', enabled: true, scope: 'all' },
  { id: 'fg-3', name: 'Intelligence Hub', description: 'Agent memory and profile editors', enabled: true, scope: 'admins' },
  { id: 'fg-4', name: 'Chat Interface', description: 'Real-time chat with agents', enabled: true, scope: 'all' },
  { id: 'fg-5', name: 'Score Simulator', description: 'What-if scoring calculations', enabled: false, scope: 'admins' },
  { id: 'fg-6', name: 'A2A Protocol', description: 'Agent-to-agent communication keys', enabled: true, scope: 'selected' },
  { id: 'fg-7', name: 'Guardrails Editor', description: 'XML guardrail configuration', enabled: false, scope: 'admins' },
  { id: 'fg-8', name: 'LLM-as-Judge', description: 'Automated output quality scoring', enabled: false, scope: 'admins' },
];

export function FeaturesPage() {
  const [gates, setGates] = useState(MOCK_GATES);

  function toggleGate(id: string) {
    setGates((prev) => prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)));
  }

  function changeScope(id: string, scope: FeatureGate['scope']) {
    setGates((prev) => prev.map((g) => (g.id === id ? { ...g, scope } : g)));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Feature Gates</h2>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="grid grid-cols-[1fr_120px_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Feature</span>
          <span>Scope</span>
          <span className="text-center">Enabled</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {gates.map((gate) => (
            <div
              key={gate.id}
              className="grid grid-cols-[1fr_120px_80px] items-center gap-4 px-4 py-3 text-sm"
            >
              <div>
                <div className="font-medium text-[var(--text-primary)]">{gate.name}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{gate.description}</div>
              </div>
              <select
                value={gate.scope}
                onChange={(e) => changeScope(gate.id, e.target.value as FeatureGate['scope'])}
                className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-transparent px-2 py-1 text-xs"
              >
                <option value="all">All Users</option>
                <option value="admins">Admins Only</option>
                <option value="selected">Selected</option>
              </select>
              <div className="flex justify-center">
                <button
                  onClick={() => toggleGate(gate.id)}
                  className={`h-5 w-9 rounded-full transition-colors ${
                    gate.enabled ? 'bg-[var(--state-active)]' : 'bg-[var(--border-default)]'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      gate.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
