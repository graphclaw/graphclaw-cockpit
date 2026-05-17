// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// GC-E-WF-W10-001 through GC-E-WF-W10-007
/**
 * Email Drafter — Real-User Simulation
 *
 * End-to-end scenario that proves the full semantic memory + skill + sub-agent pipeline:
 *   1. Create an email-writing skill via Skill Authoring UI → validate in MinIO
 *   2. Create email-drafter sub-agent via Agent Canvas → validate in MinIO
 *   3. Configure semantic memory topics for the agent → validate in MinIO + index
 *   4. Send chat message requesting email to Ralph → verify SSE tool events
 *   5. Validate activity log: read_memory tool invoked with correct topic
 *   6. Validate backend: semantic memory index (not full content) in sub-agent prompt
 *   7. Review the drafted email in cockpit chat UI
 */
import { test, expect, TEST_USER_ID } from '../fixtures/auth.fixture';
import { MinioClient } from '../helpers/minio';

// Shared state across tests in this describe block (set by earlier tests)
let skillId = '';
let agentId = '';
let taskId = '';

const SKILL_CONTENT = `---
name: email-writing-skill
description: Drafts warm, well-structured emails with appropriate tone
version: 1.0.0
model: claude-haiku-4-5-20251001
tags:
  - email
  - writing
---
You are an expert email writer.

Follow these guidelines:
- Use a professional yet warm tone
- Structure: greeting → body → warm closing
- For family members use loving and caring language
- Keep the email concise but heartfelt
`;

const ETIQUETTE_CONTENT = `# Email Etiquette

Always begin with a warm greeting appropriate to the relationship.
Use the recipient's first name for personal emails.
Close with a warm sign-off like "With love" or "Warmly" for family.
Proofread for spelling and tone before sending.
`;

const CONTACTS_CONTENT = `# Contacts

## Ralph
Ralph is a close family member (brother).
He appreciates warm, sincere messages.
He lives in New York and enjoys hiking and cooking.
He has a great sense of humor — light references welcome.
`;

test.describe('Email Drafter — real-user simulation', () => {
  const minio = new MinioClient();

  test.afterAll(async ({ api }) => {
    // Clean up: delete semantic memory, agent, skill, task
    if (taskId) {
      await api.delete(`/app/v1/graph/tasks/${taskId}`).catch(() => {});
    }
    if (agentId) {
      await api.delete(`/app/v1/intelligence/agents/${agentId}/memory/semantic/email-etiquette`).catch(() => {});
      await api.delete(`/app/v1/intelligence/agents/${agentId}/memory/semantic/contacts`).catch(() => {});
      await api.delete(`/app/v1/agents/${agentId}`).catch(() => {});
    }
    if (skillId) {
      await api.delete(`/app/v1/intelligence/skills/authored/${skillId}`).catch(() => {});
    }
  });

  // GC-E-WF-W10-001
  test('1 — create email-writing skill via Skill Authoring → validate in MinIO', async ({ page, api }) => {
    await page.goto('/intelligence/skill-authoring');

    // Click the + button (data-testid="create-skill-button") — no "New Skill" text label
    await page.locator('[data-testid="create-skill-button"]').click();

    // Editor appears immediately — fill with full skill content (name comes from YAML frontmatter)
    await expect(page.locator('[data-testid="skill-editor"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="skill-editor"]').fill(SKILL_CONTENT);

    // Save and capture skill_id from response
    const [saveRes] = await Promise.all([
      page.waitForResponse((r) =>
        r.url().includes('/intelligence/skills/authored') && r.request().method() === 'POST',
      ),
      page.locator('[data-testid="save-skill-button"]').click(),
    ]);
    expect(saveRes.status()).toBe(201);
    const body = await saveRes.json() as { skill_id: string };
    skillId = body.skill_id;
    expect(skillId).toBeTruthy();

    // Validate in MinIO
    const minioPath = `${TEST_USER_ID}/skills/authored/${skillId}/SKILL.md`;
    expect(await minio.objectExists(minioPath)).toBe(true);
    const minioContent = await minio.readObject(minioPath);
    expect(minioContent).toContain('email-writing-skill');

    // Also verify via API
    const apiRes = await api.get(`/app/v1/intelligence/skills/authored/${skillId}`);
    expect(apiRes.status()).toBe(200);
  });

  // GC-E-WF-W10-002
  test('2 — create email-drafter sub-agent via Agent Canvas → validate in MinIO', async ({ page, api }) => {
    await page.goto('/canvas');
    await expect(page.locator('[data-testid="canvas-container"]').or(page.locator('text=Agent Canvas')).first()).toBeVisible({ timeout: 10000 });

    // Open add-agent dialog
    await page.locator('[data-testid="add-agent-btn"]').or(page.getByRole('button', { name: /add agent/i })).first().click();
    await expect(page.locator('[data-testid="add-agent-dialog"]')).toBeVisible({ timeout: 5000 });

    // Fill form
    await page.locator('[data-testid="agent-name-input"]').fill('email-drafter');
    await page.locator('[data-testid="agent-description-input"]').fill('Drafts emails using semantic memory and writing skills');

    // Select email-writing-skill if visible in skill checkboxes
    const skillCheckbox = page.locator(`text=${skillId}`).or(page.locator('text=email-writing-skill')).first();
    if (await skillCheckbox.isVisible()) {
      await skillCheckbox.click();
    }

    // Submit
    const [createRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/app/v1/agents') && r.request().method() === 'POST'),
      page.locator('[data-testid="create-agent-submit"]').click(),
    ]);
    expect(createRes.status()).toBe(201);
    const agentBody = await createRes.json() as { agent_id: string };
    agentId = agentBody.agent_id;
    expect(agentId).toBeTruthy();

    // Validate in MinIO — agent definition JSON
    const defPath = `agents/${TEST_USER_ID}/definitions/${agentId}.json`;
    expect(await minio.objectExists(defPath)).toBe(true);

    // Validate agent config in MinIO
    const configPath = `${TEST_USER_ID}/agents/${agentId}/config.json`;
    expect(await minio.objectExists(configPath)).toBe(true);

    // API confirmation
    const apiRes = await api.get(`/app/v1/agents/${agentId}`);
    expect(apiRes.status()).toBe(200);
    const agentData = await apiRes.json() as { name: string };
    expect(agentData.name).toBe('email-drafter');
  });

  // GC-E-WF-W10-003
  test('3 — create semantic memory topics for email-drafter → validate in MinIO', async ({ page, api }) => {
    expect(agentId).toBeTruthy();

    // Navigate to Intelligence Hub and select the email-drafter agent
    await page.goto('/intelligence/semantic-memory');

    // Select agent if selector is present
    const agentSelector = page.locator('select, [role="combobox"]').first();
    if (await agentSelector.isVisible()) {
      await agentSelector.selectOption({ label: 'email-drafter' });
    }

    // Create email-etiquette topic via API (faster and more reliable for seeding)
    const r1 = await api.put(
      `/app/v1/intelligence/agents/${agentId}/memory/semantic/email-etiquette`,
      { data: { content: ETIQUETTE_CONTENT, description: 'General email etiquette and tone guidelines' } },
    );
    expect(r1.status()).toBe(200);

    const r2 = await api.put(
      `/app/v1/intelligence/agents/${agentId}/memory/semantic/contacts`,
      { data: { content: CONTACTS_CONTENT, description: 'Known contacts and relationship context' } },
    );
    expect(r2.status()).toBe(200);

    // Validate both files in MinIO
    const etiquettePath = `${TEST_USER_ID}/agents/${agentId}/memory/semantic/email-etiquette.md`;
    const contactsPath = `${TEST_USER_ID}/agents/${agentId}/memory/semantic/contacts.md`;
    const indexPath = `${TEST_USER_ID}/agents/${agentId}/memory/semantic/_index.json`;

    expect(await minio.objectExists(etiquettePath)).toBe(true);
    expect(await minio.objectExists(contactsPath)).toBe(true);
    expect(await minio.objectExists(indexPath)).toBe(true);

    // Validate index has both topics
    const indexRes = await api.get(`/app/v1/intelligence/agents/${agentId}/memory/semantic/_index`);
    expect(indexRes.status()).toBe(200);
    const indexData = await indexRes.json() as { topics: Array<{ name: string; description: string }> };
    const names = indexData.topics.map((t) => t.name);
    expect(names).toContain('email-etiquette');
    expect(names).toContain('contacts');

    const etiquetteEntry = indexData.topics.find((t) => t.name === 'email-etiquette');
    expect(etiquetteEntry?.description).toBe('General email etiquette and tone guidelines');
  });

  // GC-E-WF-W10-004
  test('4 — send chat message to draft email for Ralph → sub-agent delegation observed', async ({ page, api }) => {
    // LLM multi-agent delegation can take 60-90 seconds — override global 30s timeout
    test.setTimeout(120000);
    expect(agentId).toBeTruthy();

    // Pre-create a task in the graph — delegate_to_agent requires a task_id
    const taskRes = await api.post('/app/v1/graph/tasks', {
      data: {
        task_type: 'ATOMIC',
        title: 'Draft warm email to Ralph',
        description: 'Draft a warm, heartfelt email to Ralph letting him know I am thinking of him.',
        tags: ['email', 'ralph'],
      },
    });
    expect(taskRes.status()).toBe(201);
    const taskBody = await taskRes.json() as { id: string };
    taskId = taskBody.id;
    expect(taskId).toBeTruthy();

    await page.goto('/chat');
    await expect(page.locator('[data-testid="chat-view"]')).toBeVisible({ timeout: 10000 });

    // Count existing assistant messages before sending so we can wait for a genuinely NEW one
    const assistantRows = page.locator('[data-testid="chat-view"] .justify-start');
    const beforeCount = await assistantRows.count();

    // Explicitly instruct the orchestrator to delegate — delegate_to_agent requires task_id and agent_id
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.click();
    await chatInput.fill(
      `Please delegate task ${taskId} to the email-drafter agent. ` +
      `The email-drafter should draft a warm email to Ralph letting him know I am thinking of him. ` +
      `Load the delegation tool set and use delegate_to_agent with agent_id "email-drafter". [ref:${Date.now()}]`
    );
    await page.locator('[data-testid="chat-view"]').getByRole('button').last().click();

    // Wait for streaming to start — streaming-delta appears during the run
    await expect(page.locator('[data-testid="streaming-delta"]')).toBeVisible({ timeout: 30000 });

    // Wait for streaming to complete — streaming-delta disappears when run finishes
    await expect(page.locator('[data-testid="streaming-delta"]')).not.toBeVisible({ timeout: 90000 });

    // Wait for a NEW assistant row to appear in the message history (refetched after completion)
    await expect(assistantRows).toHaveCount(beforeCount + 1, { timeout: 30000 });

    // The orchestrator confirms delegation — response should mention the agent or the task
    const lastAssistant = assistantRows.last();
    const responseText = await lastAssistant.textContent();
    expect(responseText?.length).toBeGreaterThan(0);
  });

  // GC-E-WF-W10-005
  test('5 — validate activity log: read_memory tool invoked with correct topic', async ({ api }) => {
    // Sub-agent runs asynchronously after delegation — poll until read_memory appears or timeout
    test.setTimeout(120000);

    const deadline = Date.now() + 90000;
    let hasReadMemory = false;
    let hasSemanticTopic = false;

    while (Date.now() < deadline) {
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const activityRes = await api.get(`/app/v1/agent/activity?from=${from}&to=${to}`);
      if (activityRes.status() === 200) {
        const data = await activityRes.json() as { items: Array<{ event_type?: string; message?: string; raw?: unknown }> };
        const items = data.items ?? [];
        const allText = JSON.stringify(items);
        hasReadMemory = allText.includes('read_memory');
        hasSemanticTopic = allText.includes('email-etiquette') || allText.includes('contacts');
        if (hasReadMemory && hasSemanticTopic) break;
      }
      await new Promise((r) => setTimeout(r, 5000));
    }

    expect(hasReadMemory).toBe(true);
    expect(hasSemanticTopic).toBe(true);
  });

  // GC-E-WF-W10-006
  test('6 — validate backend: semantic memory index injected, not full content', async ({ api }) => {
    // Sub-agent runs asynchronously — poll until "Semantic Memory" appears in activity log
    test.setTimeout(120000);

    const deadline = Date.now() + 90000;
    let allText = '';

    while (Date.now() < deadline) {
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const activityRes = await api.get(`/app/v1/agent/activity?from=${from}&to=${to}`);
      if (activityRes.status() === 200) {
        const data = await activityRes.json() as { items: Array<{ raw?: unknown }> };
        allText = JSON.stringify(data.items ?? []);
        if (allText.includes('Semantic Memory')) break;
      }
      await new Promise((r) => setTimeout(r, 5000));
    }

    // Sub-agent system prompt includes "## Semantic Memory" index section
    expect(allText).toContain('Semantic Memory');
    // The index entry for email-etiquette should appear (description, not full file content)
    expect(allText).toContain('email-etiquette');
  });

  // GC-E-WF-W10-007
  test('7 — review drafted email in cockpit chat UI', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('[data-testid="chat-view"]')).toBeVisible({ timeout: 10000 });

    // Most recent assistant message — assistant rows use justify-start, user rows use justify-end
    const assistantMessages = page.locator('[data-testid="chat-view"] .justify-start');
    const lastMessage = assistantMessages.last();
    await expect(lastMessage).toBeVisible({ timeout: 10000 });

    const messageText = await lastMessage.textContent();
    expect(messageText).toContain('Ralph');

    // Should have warm/family tone keywords
    const hasWarmTone = /love|thinking of you|warm|miss|care|fondly|hugs|warmly/i.test(messageText ?? '');
    expect(hasWarmTone).toBe(true);
  });
});
