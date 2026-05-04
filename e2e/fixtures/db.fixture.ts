import { test as base } from '@playwright/test';
import { DbClient } from '../helpers/db.js';

type DbFixtures = { db: DbClient };

export const test = base.extend<DbFixtures>({
  db: async ({}, use) => {
    const db = new DbClient();
    await db.connect();
    await use(db);
    await db.disconnect();
  },
});
