// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * AddAgentDialog — Dialog for creating a new sub-agent (F8).
 *
 * Name→slugify preview, description, LLM model selector,
 * optional initial skills/MCP/tool sets selection.
 */
import { useState } from 'react';
import { Loader2, Brain } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInstalledSkills, useMCPServers, useCreateAgentDefinition } from './hooks/useCanvasApi';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

const LLM_MODELS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { value: 'claude-haiku-4-20250514', label: 'Claude Haiku 4' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
];

const TOOL_SETS = [
  { id: 'task_management', name: 'Task Management' },
  { id: 'planning', name: 'Planning' },
  { id: 'skills', name: 'Skills' },
  { id: 'mcp', name: 'MCP' },
  { id: 'delegation', name: 'Delegation' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (agentId: string, agentName: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddAgentDialog({ open, onOpenChange, onCreated }: AddAgentDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [llmModel, setLlmModel] = useState('claude-sonnet-4-20250514');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedMcp, setSelectedMcp] = useState<string[]>([]);
  const [selectedToolSets, setSelectedToolSets] = useState<string[]>([]);

  const { data: skills } = useInstalledSkills();
  const { data: mcpServers } = useMCPServers();
  const createAgent = useCreateAgentDefinition();

  const agentId = slugify(name);
  const canSubmit = name.trim().length > 0 && description.trim().length > 0 && !createAgent.isPending;

  function toggleItem(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    try {
      const result = await createAgent.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        config: {
          llm_model: llmModel,
          skills: selectedSkills.length > 0 ? selectedSkills : null,
          mcp_servers: selectedMcp.length > 0 ? selectedMcp : null,
          tool_sets: selectedToolSets.length > 0 ? selectedToolSets : null,
          sub_agents: null,
        },
      });
      onCreated(result.agent_id, result.name);
      // Reset form
      setName('');
      setDescription('');
      setLlmModel('claude-sonnet-4-20250514');
      setSelectedSkills([]);
      setSelectedMcp([]);
      setSelectedToolSets([]);
      onOpenChange(false);
    } catch {
      // error displayed inline
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="add-agent-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain size={18} className="text-sky-400" />
            Add Sub-Agent
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="agent-name">Agent Name *</Label>
            <Input
              id="agent-name"
              placeholder="Research Assistant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="agent-name-input"
            />
            {agentId && (
              <p className="text-[11px] text-[var(--text-tertiary)]">
                ID: <code className="font-mono">{agentId}</code>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="agent-description">Description *</Label>
            <Input
              id="agent-description"
              placeholder="Handles research and summarization tasks"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="agent-description-input"
            />
          </div>

          {/* LLM Model */}
          <div className="space-y-1.5">
            <Label>LLM Model</Label>
            <Select value={llmModel} onValueChange={setLlmModel}>
              <SelectTrigger data-testid="llm-model-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LLM_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Initial Skills */}
          {skills && skills.length > 0 && (
            <div className="space-y-1.5">
              <Label>Initial Skills (optional)</Label>
              <div className="max-h-24 space-y-1 overflow-y-auto rounded border border-[var(--border-subtle)] p-2">
                {skills.map((s) => (
                  <label key={s.skill_id} className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(s.skill_id)}
                      onChange={() => toggleItem(selectedSkills, setSelectedSkills, s.skill_id)}
                      className="rounded"
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Initial MCP */}
          {mcpServers && mcpServers.length > 0 && (
            <div className="space-y-1.5">
              <Label>Initial MCP Servers (optional)</Label>
              <div className="max-h-24 space-y-1 overflow-y-auto rounded border border-[var(--border-subtle)] p-2">
                {mcpServers.map((s) => (
                  <label key={s.server_id} className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedMcp.includes(s.server_id)}
                      onChange={() => toggleItem(selectedMcp, setSelectedMcp, s.server_id)}
                      className="rounded"
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tool Sets */}
          <div className="space-y-1.5">
            <Label>Tool Sets (optional)</Label>
            <div className="grid grid-cols-2 gap-1">
              {TOOL_SETS.map((ts) => (
                <label key={ts.id} className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedToolSets.includes(ts.id)}
                    onChange={() => toggleItem(selectedToolSets, setSelectedToolSets, ts.id)}
                    className="rounded"
                  />
                  <span>{ts.name}</span>
                </label>
              ))}
            </div>
          </div>

          {createAgent.isError && (
            <p className="text-xs text-red-400">
              Failed to create agent. Please try again.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createAgent.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="create-agent-submit"
          >
            {createAgent.isPending ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Agent'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
