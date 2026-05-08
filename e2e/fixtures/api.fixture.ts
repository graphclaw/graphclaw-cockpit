// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test as base } from '@playwright/test';
import { ApiClient, getDevToken } from '../helpers/api.js';

type ApiFixtures = { apiClient: ApiClient };

export const test = base.extend<ApiFixtures>({
  apiClient: async ({}, use) => {
    const { access_token } = await getDevToken();
    const client = new ApiClient(access_token);
    await use(client);
  },
});
