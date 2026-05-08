// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-U-SKL-W50-001 - maps raw skill errors to plain-language summaries.
 *
 * Scenario: Failed skill jobs should show concise human-readable error text in the
 * skills recent-jobs table regardless of backend error payload shape.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L1 Unit
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - maps timeout errors and keeps duration when present
 *  - maps ToolNotFound and ValidationError values
 *  - truncates unknown error text to 80 chars
 */
import { formatSkillError } from './formatSkillError';

describe('formatSkillError', () => {
  it('maps timeout errors and keeps duration when available', () => {
    expect(formatSkillError('TimeoutError: timed out after 45s while waiting for tool')).toBe(
      'timed out after 45s',
    );
  });

  it('maps ToolNotFound and ValidationError values', () => {
    expect(formatSkillError({ name: 'ToolNotFound', message: 'tool x missing' })).toBe(
      'skill setup is missing - check Settings',
    );
    expect(formatSkillError({ name: 'ValidationError', message: 'bad payload' })).toBe(
      'input validation failed',
    );
  });

  it('truncates unknown errors to 80 chars', () => {
    const longError = 'X'.repeat(120);
    expect(formatSkillError(longError)).toHaveLength(80);
    expect(formatSkillError(longError).endsWith('...')).toBe(true);
  });
});
