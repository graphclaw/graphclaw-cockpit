// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom/vitest';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
