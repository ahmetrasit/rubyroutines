import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const AUTH_DIR = path.join(__dirname, '..', '.auth');

/**
 * Test fixtures for Ruby Routines E2E tests
 * Uses pre-authenticated sessions from global setup to avoid rate limiting
 */
export const test = base.extend<{
  authenticatedPage: Page;
  secondUserPage: Page;
  teacherPage: Page;
}>({
  // Authenticated page for primary test user
  authenticatedPage: async ({ browser }, use) => {
    const authFile = path.join(AUTH_DIR, 'user1.json');
    const context = await createAuthenticatedContext(browser, authFile);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Authenticated page for secondary test user (co-parent tests)
  secondUserPage: async ({ browser }, use) => {
    const authFile = path.join(AUTH_DIR, 'user2.json');
    const context = await createAuthenticatedContext(browser, authFile);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Authenticated page for teacher user
  teacherPage: async ({ browser }, use) => {
    const authFile = path.join(AUTH_DIR, 'teacher.json');
    const context = await createAuthenticatedContext(browser, authFile);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

/**
 * Check if primary user auth is available with valid cookies
 */
export function hasValidAuth(): boolean {
  const authFile = path.join(AUTH_DIR, 'user1.json');
  if (!fs.existsSync(authFile)) return false;
  try {
    const content = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    return content.cookies && content.cookies.length > 0;
  } catch {
    return false;
  }
}

/**
 * Check if teacher auth is available
 */
export function hasTeacherAuth(): boolean {
  const authFile = path.join(AUTH_DIR, 'teacher.json');
  if (!fs.existsSync(authFile)) return false;
  try {
    const content = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    return content.cookies && content.cookies.length > 0;
  } catch {
    return false;
  }
}

/**
 * Create a browser context with stored authentication
 */
async function createAuthenticatedContext(browser: any, authFile: string): Promise<BrowserContext> {
  if (fs.existsSync(authFile)) {
    return await browser.newContext({ storageState: authFile });
  }
  // Fallback to empty context if auth file doesn't exist
  return await browser.newContext();
}

/**
 * Login helper function - used for tests that need fresh login
 */
export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Dismiss cookie banner if present
  await dismissCookieBanner(page);

  // Check for rate limiting
  const rateLimitError = page.getByText(/too many requests/i);
  if (await rateLimitError.isVisible({ timeout: 1000 }).catch(() => false)) {
    const errorText = await rateLimitError.textContent();
    const match = errorText?.match(/(\d+)\s*seconds/);
    const waitTime = match && match[1] ? parseInt(match[1]) * 1000 + 5000 : 95000;
    console.log(`Rate limited, waiting ${waitTime / 1000} seconds...`);
    await page.waitForTimeout(waitTime);
    await page.reload();
    await page.waitForLoadState('networkidle');
  }

  // Fill login form
  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill(password);
  await page.getByRole('button', { name: /submit login form/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(parent|teacher|dashboard)/, { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Dismiss cookie consent banner
 */
export async function dismissCookieBanner(page: Page): Promise<void> {
  const acceptButton = page.getByRole('button', { name: /accept all/i });
  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await dismissCookieBanner(page);
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * Get text content safely
 */
export async function getTextContent(page: Page, selector: string): Promise<string | null> {
  const element = page.locator(selector);
  if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
    return await element.textContent();
  }
  return null;
}

// Re-export expect for convenience
export { expect };
