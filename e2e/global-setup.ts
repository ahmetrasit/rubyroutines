import { chromium, FullConfig, Cookie } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_DIR = path.join(__dirname, '.auth');

/**
 * Global setup - runs once before all tests
 * Logs in all test users and saves their authentication state
 */
async function globalSetup(config: FullConfig) {
  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3001';
  const browser = await chromium.launch();

  // Login primary user
  if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
    await loginAndSaveState(
      browser,
      baseURL,
      process.env.TEST_USER_EMAIL,
      process.env.TEST_USER_PASSWORD,
      path.join(AUTH_DIR, 'user1.json')
    );
  }

  // Login secondary user (co-parent)
  if (process.env.TEST_USER2_EMAIL && process.env.TEST_USER2_PASSWORD) {
    await loginAndSaveState(
      browser,
      baseURL,
      process.env.TEST_USER2_EMAIL,
      process.env.TEST_USER2_PASSWORD,
      path.join(AUTH_DIR, 'user2.json')
    );
  }

  // Login teacher user
  if (process.env.TEST_TEACHER_EMAIL && process.env.TEST_TEACHER_PASSWORD) {
    await loginAndSaveState(
      browser,
      baseURL,
      process.env.TEST_TEACHER_EMAIL,
      process.env.TEST_TEACHER_PASSWORD,
      path.join(AUTH_DIR, 'teacher.json')
    );
  }

  await browser.close();
}

async function loginAndSaveState(
  browser: any,
  baseURL: string,
  email: string,
  password: string,
  storagePath: string
) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`Logging in ${email}...`);

    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

    // Dismiss cookie banner if present
    const acceptButton = page.getByRole('button', { name: /accept all/i });
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }

    // Check for rate limiting and wait if necessary
    const rateLimitError = page.getByText(/too many requests/i);
    if (await rateLimitError.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('Rate limited, waiting 90 seconds...');
      await page.waitForTimeout(90000);
      await page.reload();
      await page.waitForLoadState('networkidle');
    }

    // Fill and submit login form
    await page.locator('input#email').fill(email);
    await page.locator('input#password').fill(password);
    await page.getByRole('button', { name: /submit login form/i }).click();

    // Wait for successful login redirect
    await page.waitForURL(/\/(parent|teacher|dashboard)/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Wait a bit for Supabase to fully initialize localStorage
    await page.waitForTimeout(2000);

    // Get the Supabase auth cookie and also set it in localStorage
    // Supabase client checks localStorage first
    const cookies = await context.cookies();
    const authCookie = cookies.find((c: Cookie) => c.name.includes('sb-') && c.name.includes('-auth-token'));
    if (authCookie) {
      // Decode and set in localStorage for Supabase client
      await page.evaluate((cookieValue: string) => {
        try {
          // The cookie value is base64 encoded JSON
          const decoded = atob(cookieValue.replace('base64-', ''));
          const parsed = JSON.parse(decoded);

          // Supabase stores auth in localStorage with the same key pattern
          const storageKey = Object.keys(localStorage).find(k => k.includes('sb-') && k.includes('-auth-token'));
          if (!storageKey) {
            // Find the project ref from the cookie name or use a default pattern
            const projectRef = 'gpfvnmpyuypvjtdlxrel';
            localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(parsed));
          }
        } catch (e) {
          console.log('Failed to set localStorage auth:', e);
        }
      }, authCookie.value);
    }

    // Save authentication state
    await context.storageState({ path: storagePath });
    console.log(`Auth state saved for ${email}`);
  } catch (error) {
    console.error(`Failed to login ${email}:`, error);
    // Create empty auth state to prevent test failures
    fs.writeFileSync(storagePath, JSON.stringify({ cookies: [], origins: [] }));
  } finally {
    await context.close();
  }
}

export default globalSetup;
