// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test as base } from '@playwright/test';
import { MinioClient } from '../helpers/minio.js';

type MinioFixtures = { minio: MinioClient };

export const test = base.extend<MinioFixtures>({
  minio: async ({}, use) => {
    const minio = new MinioClient();
    await use(minio);
  },
});
