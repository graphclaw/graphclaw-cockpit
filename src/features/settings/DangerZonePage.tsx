import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

export function DangerZonePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--state-error)] bg-[var(--state-error)]/5 p-4">
        <AlertTriangle size={20} className="text-[var(--state-error)]" />
        <div>
          <h2 className="text-sm font-semibold text-[var(--state-error)]">Danger Zone</h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            Irreversible actions that affect your entire organization
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <div>
            <div className="font-medium text-[var(--text-primary)]">Reset All Settings</div>
            <div className="text-xs text-[var(--text-tertiary)]">
              Restore all settings to their default values. This cannot be undone.
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-[var(--state-error)] text-[var(--state-error)]">
            Reset Settings
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <div>
            <div className="font-medium text-[var(--text-primary)]">Clear All Data</div>
            <div className="text-xs text-[var(--text-tertiary)]">
              Delete all tasks, goals, projects, and agent memory. This cannot be undone.
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-[var(--state-error)] text-[var(--state-error)]">
            <Trash2 size={14} className="mr-1" /> Clear Data
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <div>
            <div className="font-medium text-[var(--text-primary)]">Delete Organization</div>
            <div className="text-xs text-[var(--text-tertiary)]">
              Permanently delete this organization and all associated data.
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-[var(--state-error)] text-[var(--state-error)]">
            <Trash2 size={14} className="mr-1" /> Delete Org
          </Button>
        </div>
      </div>
    </div>
  );
}
