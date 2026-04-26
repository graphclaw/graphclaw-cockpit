import puppeteer, { type Browser, type Page, type HTTPResponse } from 'puppeteer';
import { APP_BASE, injectLocalStorage } from './auth.helper';

// ── Browser lifecycle ─────────────────────────────────────────────────────────

/**
 * Launch a headless Chromium browser with the same flags used in the
 * Docker CI environment (no sandbox, no cache).
 */
export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-cache',
      '--disable-application-cache',
      '--disable-dev-shm-usage', // avoids /dev/shm exhaustion in Docker
    ],
  });
}

// ── Authenticated page factory ────────────────────────────────────────────────

/**
 * Open a fresh browser tab, navigate to the cockpit root, inject the auth
 * token into localStorage (matching auth.fixture.ts), then reload so React
 * picks up the stored credentials.
 */
export async function newAuthenticatedPage(
  browser: Browser,
  accessToken: string,
  refreshToken: string,
): Promise<Page> {
  const page = await browser.newPage();
  // Disable cache headers to always get fresh assets from Vite
  await page.setCacheEnabled(false);
  await page.goto(APP_BASE, { waitUntil: 'networkidle0', timeout: 30000 });
  await injectLocalStorage(page, accessToken, refreshToken);
  return page;
}

// ── Navigation helper ─────────────────────────────────────────────────────────

/**
 * Navigate to a cockpit route and wait for the first matching API response.
 * Returns the API response so tests can assert status codes.
 *
 * @param page        Authenticated Puppeteer Page
 * @param route       Front-end route (e.g. '/tasks')
 * @param apiPattern  URL substring to wait for (e.g. '/app/v1/graph/tasks')
 */
export async function gotoAndWaitForApi(
  page: Page,
  route: string,
  apiPattern: string,
): Promise<HTTPResponse | null> {
  const [apiRes] = await Promise.all([
    page.waitForResponse(
      (res: HTTPResponse) => res.url().includes(apiPattern),
      { timeout: 20000 },
    ),
    page.goto(`${APP_BASE}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    }),
  ]).catch(() => [null]);
  return apiRes as HTTPResponse | null;
}

// ── Text-wait helper ──────────────────────────────────────────────────────────

/**
 * Wait until the page body contains the given text string.
 * More reliable than waitForSelector when content is rendered dynamically.
 */
export async function waitForText(
  page: Page,
  text: string,
  timeout = 15000,
): Promise<void> {
  await page.waitForFunction(
    (t: string) => document.body.innerText.includes(t),
    { timeout },
    text,
  );
}

// ── Response-intercepting click ───────────────────────────────────────────────

/**
 * Click a selector and wait for a specific API response in one atomic step.
 * Prevents the race condition where the response arrives before the listener
 * is registered.
 */
export async function clickAndWaitForApi(
  page: Page,
  selector: string,
  apiPattern: string,
  method?: string,
): Promise<HTTPResponse> {
  const [res] = await Promise.all([
    page.waitForResponse(
      (r: HTTPResponse) => {
        const urlMatch = r.url().includes(apiPattern);
        const methodMatch = method ? r.request().method() === method : true;
        return urlMatch && methodMatch;
      },
      { timeout: 20000 },
    ),
    page.click(selector),
  ]);
  return res;
}
