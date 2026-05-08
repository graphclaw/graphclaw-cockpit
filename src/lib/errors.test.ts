// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { parseApiError, getErrorMessage } from '@/lib/errors';

describe('parseApiError', () => {
  it('parses RFC 7807 error object', () => {
    const error = {
      type: 'urn:graphclaw:error:not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Goal GOAL-999 not found',
      instance: '/app/v1/graph/goals/GOAL-999',
    };

    const result = parseApiError(error);
    expect(result.type).toBe('urn:graphclaw:error:not-found');
    expect(result.title).toBe('Not Found');
    expect(result.status).toBe(404);
    expect(result.detail).toBe('Goal GOAL-999 not found');
    expect(result.instance).toBe('/app/v1/graph/goals/GOAL-999');
  });

  it('handles partial error objects', () => {
    const error = { status: 500 };
    const result = parseApiError(error);
    expect(result.title).toBe('An error occurred');
    expect(result.status).toBe(500);
  });

  it('handles Error instances', () => {
    const result = parseApiError(new Error('Network failure'));
    expect(result.title).toBe('Network failure');
    expect(result.status).toBe(500);
  });

  it('handles unknown errors', () => {
    const result = parseApiError('something unexpected');
    expect(result.title).toBe('An unexpected error occurred');
    expect(result.status).toBe(500);
  });
});

describe('getErrorMessage', () => {
  it('returns detail when present', () => {
    const msg = getErrorMessage({ status: 400, title: 'Bad Request', detail: 'Missing field' });
    expect(msg).toBe('Missing field');
  });

  it('falls back to title when no detail', () => {
    const msg = getErrorMessage({ status: 500, title: 'Server Error' });
    expect(msg).toBe('Server Error');
  });
});
