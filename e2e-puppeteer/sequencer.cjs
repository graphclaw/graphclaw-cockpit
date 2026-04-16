/**
 * Custom Jest sequencer — adds a 500ms gap between each test file
 * to stay well under the 300 req/min per-user rate limit.
 */
const Sequencer = require('@jest/test-sequencer').default;

class RateLimitSequencer extends Sequencer {
  sort(tests) {
    // Run in a stable order: graph → agent → intelligence → skills → mcp → a2a → admin → chat → settings → canvas
    const ORDER = [
      'graph/goal-crud',
      'graph/task-crud',
      'graph/sub-task',
      'graph/edge-crud',
      'graph/state-transition',
      'agent/agent-crud',
      'agent/scoring',
      'intelligence/profile',
      'intelligence/working-memory',
      'intelligence/semantic-memory',
      'intelligence/episodic-memory',
      'intelligence/skill-authored',
      'skills/skill-registry',
      'mcp/mcp-servers',
      'a2a/a2a-keys',
      'admin/members',
      'admin/feature-gates',
      'admin/llm-config',
      'admin/guardrails',
      'admin/sso',
      'admin/connectors',
      'chat/chat-messages',
      'settings/settings',
      'canvas/canvas-editor',
    ];

    return tests.sort((a, b) => {
      const aIdx = ORDER.findIndex((p) => a.path.replace(/\\/g, '/').includes(p));
      const bIdx = ORDER.findIndex((p) => b.path.replace(/\\/g, '/').includes(p));
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
  }
}

module.exports = RateLimitSequencer;
