import type { Browser, Page } from 'puppeteer';
import { getDevToken, TEST_USER_ID } from '../helpers/auth.helper';
import { ApiClient } from '../helpers/api.helper';
import { DbClient } from '../helpers/db.helper';
import { MinioClient } from '../helpers/minio.helper';
import { launchBrowser, newAuthenticatedPage } from '../helpers/browser.helper';

// ── TestContext ────────────────────────────────────────────────────────────────
/**
 * Bundles every layer a spec needs: real API, real DB, real MinIO, real browser.
 *
 * Typical usage in a Jest spec file:
 *
 *   let ctx: TestContext;
 *
 *   beforeAll(async () => { ctx = await TestContext.create(); });
 *   afterAll(async () => { await ctx.destroy(); });
 *
 *   test('...', async () => {
 *     const page = await ctx.newPage();
 *     // test body
 *     await page.close();
 *   });
 */
export class TestContext {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly userId: string;
  readonly api: ApiClient;
  readonly db: DbClient;
  readonly minio: MinioClient;
  readonly browser: Browser;

  private constructor(
    accessToken: string,
    refreshToken: string,
    api: ApiClient,
    db: DbClient,
    minio: MinioClient,
    browser: Browser,
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userId = TEST_USER_ID;
    this.api = api;
    this.db = db;
    this.minio = minio;
    this.browser = browser;
  }

  /**
   * Create a fully-initialised context:
   *  1. Fetch dev token from real /auth/dev-token endpoint
   *  2. Open PostgreSQL + AGE connection
   *  3. Launch Chromium
   */
  static async create(): Promise<TestContext> {
    const tokens = await getDevToken();
    const api = new ApiClient(tokens.access_token);
    const db = new DbClient();
    await db.connect();
    const minio = new MinioClient();
    const browser = await launchBrowser();
    return new TestContext(tokens.access_token, tokens.refresh_token, api, db, minio, browser);
  }

  /**
   * Open a new authenticated browser page.
   * Each test should call this and close the page in a finally block.
   */
  async newPage(): Promise<Page> {
    return newAuthenticatedPage(this.browser, this.accessToken, this.refreshToken);
  }

  /**
   * Tear down: close the browser and disconnect from Postgres.
   * Always call this in afterAll so Jest doesn't hang on open handles.
   */
  async destroy(): Promise<void> {
    await this.browser.close().catch(() => {});
    await this.db.disconnect().catch(() => {});
  }
}
