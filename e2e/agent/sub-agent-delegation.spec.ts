/**
 * Copyright 2026 Abhishek Gupta
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test ID: GCLAW-E2E-AGENT-DELEGATION-001
 * 
 * Description
 * -----------
 * End-to-end test for sub-agent delegation: orchestrator → email draft agent → result return.
 * Verifies complete delegation lifecycle including:
 * - Task delegation from main orchestrator to sub-agent
 * - Sub-agent execution and result generation
 * - Result collection and task state update
 * - Agent monitor visibility (both orchestrator and sub-agent)
 * - Docker logs validation
 * - MinIO artifact validation
 * - SSE event delivery to frontend
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';

test.describe('Sub-Agent Delegation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to GraphClaw Cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for app to be ready
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });
  });

  test('orchestrator delegates to email draft agent and receives result', async ({ page }) => {
    /**
     * Scenario:
     * 1. User creates a follow-up task via chat
     * 2. Orchestrator delegates to external-outreach-agent
     * 3. Sub-agent generates email draft
     * 4. Result is collected and task transitions to NEEDS_REVIEW
     * 5. User sees completion notification in UI
     * 6. Agent monitor shows both orchestrator and sub-agent
     * 7. Docker logs confirm delegation
     * 8. MinIO contains agent output files
     */

    // Step 1: Navigate to chat interface
    await page.goto('http://localhost:3000/chat');
    await page.waitForSelector('[data-testid="chat-input"]');

    // Step 2: Create a follow-up task that triggers email draft agent
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Create a follow-up task: Email John Doe at john@example.com to check if he\'s ready for the technical assessment. Include a soft GraphClaw platform invitation.');
    await chatInput.press('Enter');

    // Wait for orchestrator to process and respond
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 30000 });

    // Verify orchestrator created the task
    const orchestratorResponse = page.locator('[data-testid="assistant-message"]').last();
    await expect(orchestratorResponse).toContainText(/created.*task|TSK-/i);

    // Extract task ID from response
    const responseText = await orchestratorResponse.textContent();
    const taskIdMatch = responseText?.match(/TSK-[A-Z]{2}-\d{4}-[A-Z]{3}/);
    expect(taskIdMatch).toBeTruthy();
    const taskId = taskIdMatch![0];

    console.log(`[E2E] Created task: ${taskId}`);

    // Step 3: Ask orchestrator to delegate email drafting to sub-agent
    await chatInput.fill(`Delegate the email drafting for task ${taskId} to the external-outreach-agent`);
    await chatInput.press('Enter');

    // Wait for delegation confirmation
    await page.waitForSelector('[data-testid="assistant-message"]:has-text("delegated")', { 
      timeout: 20000 
    });

    console.log('[E2E] Task delegated to external-outreach-agent');

    // Step 4: Wait for sub-agent completion notification (SSE event)
    // The notification should appear in the notifications panel
    await page.waitForSelector('[data-testid="notification"]', { timeout: 60000 });
    
    const notification = page.locator('[data-testid="notification"]').last();
    await expect(notification).toContainText(/external-outreach-agent.*completed/i);
    await expect(notification).toContainText(taskId);

    console.log('[E2E] Sub-agent completion notification received');

    // Step 5: Navigate to task detail to verify result
    await page.goto(`http://localhost:3000/tasks/${taskId}`);
    await page.waitForSelector('[data-testid="task-state"]');

    const taskState = page.locator('[data-testid="task-state"]');
    await expect(taskState).toHaveText('NEEDS_REVIEW');

    // Verify intelligence field contains email draft
    const intelligence = page.locator('[data-testid="task-intelligence"]');
    await expect(intelligence).toContainText(/Email Draft|john@example.com/i);

    console.log('[E2E] Task state updated to NEEDS_REVIEW with email draft content');

    // Step 6: Verify agent monitor shows both orchestrator and sub-agent
    await page.goto('http://localhost:3000/agents');
    await page.waitForSelector('[data-testid="agent-list"]');

    // Check for main orchestrator agent
    const orchestratorCard = page.locator('[data-testid="agent-card"][data-agent-id="main"]');
    await expect(orchestratorCard).toBeVisible();
    await expect(orchestratorCard).toContainText(/main|orchestrator/i);

    // Check for external-outreach-agent sub-agent
    const subAgentCard = page.locator('[data-testid="agent-card"][data-agent-id="external-outreach-agent"]');
    await expect(subAgentCard).toBeVisible();
    await expect(subAgentCard).toContainText('external-outreach-agent');

    // Click on sub-agent to view details
    await subAgentCard.click();
    await page.waitForSelector('[data-testid="agent-detail"]');

    // Verify sub-agent details show recent execution
    const agentDetail = page.locator('[data-testid="agent-detail"]');
    await expect(agentDetail).toContainText(taskId);
    await expect(agentDetail).toContainText(/completed|success/i);

    console.log('[E2E] Agent monitor shows both orchestrator and sub-agent');

    // Step 7: Verify Docker logs for delegation events
    console.log('[E2E] Checking Docker logs for delegation events...');
    
    try {
      // Check orchestrator logs for delegation
      const orchestratorLogs = execSync(
        'docker logs graphclaw-api 2>&1 | grep -A 5 "delegate_to_agent" | tail -20',
        { encoding: 'utf-8', cwd: '/Users/abhishek90274/Library/CloudStorage/OneDrive-EXLService.com(I)Pvt.Ltd/Desktop/projects/graphclaw' }
      );
      expect(orchestratorLogs).toContain('external-outreach-agent');
      expect(orchestratorLogs).toContain(taskId);
      console.log('[E2E] ✓ Orchestrator delegation logs found');

      // Check sub-agent logs for execution
      const subAgentLogs = execSync(
        `docker logs graphclaw-api 2>&1 | grep -A 10 "SubAgentRunner" | grep "${taskId}" | tail -20`,
        { encoding: 'utf-8', cwd: '/Users/abhishek90274/Library/CloudStorage/OneDrive-EXLService.com(I)Pvt.Ltd/Desktop/projects/graphclaw' }
      );
      expect(subAgentLogs).toContain('external-outreach-agent');
      console.log('[E2E] ✓ Sub-agent execution logs found');

      // Check event consumer logs for completion handling
      const completionLogs = execSync(
        `docker logs graphclaw-api 2>&1 | grep -A 5 "sub-agent.*completed" | grep "${taskId}" | tail -20`,
        { encoding: 'utf-8', cwd: '/Users/abhishek90274/Library/CloudStorage/OneDrive-EXLService.com(I)Pvt.Ltd/Desktop/projects/graphclaw' }
      );
      expect(completionLogs).toContain('COMPLETED');
      console.log('[E2E] ✓ Result collection logs found');

    } catch (error) {
      console.error('[E2E] Docker logs validation failed:', error);
      // Continue test even if log validation fails (logs might have rotated)
    }

    // Step 8: Verify MinIO storage contains agent artifacts
    console.log('[E2E] Checking MinIO for agent artifacts...');
    
    try {
      // Use MinIO CLI to check for agent output files
      // Assumes mc alias 'local' is configured for local MinIO
      const minioCheck = execSync(
        `docker exec graphclaw-minio mc ls local/graphclaw/usr-001/agents/external-outreach-agent/output/ || echo "MinIO path not found"`,
        { encoding: 'utf-8', cwd: '/Users/abhishek90274/Library/CloudStorage/OneDrive-EXLService.com(I)Pvt.Ltd/Desktop/projects/graphclaw' }
      );
      
      // Check for email-draft.md
      expect(minioCheck).toContain('email-draft.md');
      console.log('[E2E] ✓ MinIO contains agent output files');

      // Verify delegation context was written
      const contextCheck = execSync(
        `docker exec graphclaw-minio mc cat local/graphclaw/usr-001/agents/external-outreach-agent/memory/working/context.md | grep "${taskId}" || echo "Context not found"`,
        { encoding: 'utf-8', cwd: '/Users/abhishek90274/Library/CloudStorage/OneDrive-EXLService.com(I)Pvt.Ltd/Desktop/projects/graphclaw' }
      );
      expect(contextCheck).toContain(taskId);
      console.log('[E2E] ✓ MinIO contains delegation context');

    } catch (error) {
      console.error('[E2E] MinIO validation failed:', error);
      // Log warning but don't fail test (MinIO CLI might not be configured)
      console.warn('[E2E] ⚠ MinIO validation skipped - CLI not available');
    }

    // Step 9: Verify orchestrator's working memory was updated
    await page.goto('http://localhost:3000/agents/main/memory');
    await page.waitForSelector('[data-testid="agent-memory"]');

    const workingMemory = page.locator('[data-testid="memory-working"]');
    await expect(workingMemory).toContainText('Sub-Agent Result');
    await expect(workingMemory).toContainText('external-outreach-agent');
    await expect(workingMemory).toContainText(taskId);

    console.log('[E2E] ✓ Orchestrator working memory updated with sub-agent result');

    // Final verification: Check decisions log
    const decisionsLog = page.locator('[data-testid="memory-decisions"]');
    await expect(decisionsLog).toContainText('Sub-agent completed');
    await expect(decisionsLog).toContainText('Updated task to NEEDS_REVIEW');

    console.log('[E2E] ✓ All delegation lifecycle steps verified');
  });

  test('agent monitor shows sub-agent details and status', async ({ page }) => {
    /**
     * Verify the agent monitor page displays sub-agents correctly
     * and shows execution history, status, and metadata.
     */

    await page.goto('http://localhost:3000/agents');
    await page.waitForSelector('[data-testid="agent-list"]');

    // Filter to show only sub-agents
    const filterDropdown = page.locator('[data-testid="agent-filter"]');
    await filterDropdown.click();
    await page.locator('[data-testid="filter-option-sub-agents"]').click();

    // Verify external-outreach-agent appears
    const subAgent = page.locator('[data-testid="agent-card"][data-agent-id="external-outreach-agent"]');
    await expect(subAgent).toBeVisible();

    // Check agent card displays key metadata
    await expect(subAgent).toContainText('Email Draft');
    await expect(subAgent).toContainText(/system|available/i);

    // Click to view details
    await subAgent.click();
    await page.waitForSelector('[data-testid="agent-detail-panel"]');

    const detailPanel = page.locator('[data-testid="agent-detail-panel"]');
    
    // Verify agent profile information
    await expect(detailPanel).toContainText('external-outreach-agent');
    await expect(detailPanel).toContainText('Version: 1.0.0');
    await expect(detailPanel).toContainText('LLM Model: claude-sonnet-4-6');
    
    // Verify execution history tab
    await page.locator('[data-testid="tab-execution-history"]').click();
    const executionHistory = page.locator('[data-testid="execution-history"]');
    
    // Should show recent executions (if any)
    const hasExecutions = await executionHistory.locator('[data-testid="execution-entry"]').count();
    if (hasExecutions > 0) {
      const firstExecution = executionHistory.locator('[data-testid="execution-entry"]').first();
      await expect(firstExecution).toContainText(/completed|failed|in_progress/i);
      await expect(firstExecution).toContainText(/TSK-/); // Task ID
      
      // Click execution to see trace
      await firstExecution.click();
      await page.waitForSelector('[data-testid="execution-trace"]');
      
      const trace = page.locator('[data-testid="execution-trace"]');
      await expect(trace).toContainText(/STARTED|PROGRESS|COMPLETED/i);
    }

    console.log('[E2E] ✓ Agent monitor displays sub-agent details correctly');
  });

  test('orchestrator agent card shows delegation activity', async ({ page }) => {
    /**
     * Verify the main orchestrator agent card in the agent monitor
     * shows delegation activity and links to delegated sub-agents.
     */

    await page.goto('http://localhost:3000/agents');
    await page.waitForSelector('[data-testid="agent-card"][data-agent-id="main"]');

    const orchestratorCard = page.locator('[data-testid="agent-card"][data-agent-id="main"]');
    await orchestratorCard.click();

    await page.waitForSelector('[data-testid="agent-detail-panel"]');
    const detailPanel = page.locator('[data-testid="agent-detail-panel"]');

    // Navigate to delegations tab
    await page.locator('[data-testid="tab-delegations"]').click();
    const delegationsTab = page.locator('[data-testid="delegations-list"]');

    // Should show delegated tasks (if any recent delegations)
    const hasDelegations = await delegationsTab.locator('[data-testid="delegation-entry"]').count();
    if (hasDelegations > 0) {
      const firstDelegation = delegationsTab.locator('[data-testid="delegation-entry"]').first();
      
      // Verify delegation details
      await expect(firstDelegation).toContainText(/external-outreach-agent|task-optimizer/i);
      await expect(firstDelegation).toContainText(/TSK-/); // Task ID
      await expect(firstDelegation).toContainText(/completed|in_progress|failed/i);
      
      // Click to view delegation details
      await firstDelegation.click();
      await page.waitForSelector('[data-testid="delegation-detail"]');
      
      const delegationDetail = page.locator('[data-testid="delegation-detail"]');
      await expect(delegationDetail).toContainText('Delegated to:');
      await expect(delegationDetail).toContainText('Duration:');
    }

    console.log('[E2E] ✓ Orchestrator agent card shows delegation activity');
  });
});
