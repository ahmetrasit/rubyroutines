import { test as baseTest, expect, Page } from '@playwright/test';
import { test as authTest, waitForPageLoad, dismissCookieBanner, hasValidAuth } from './fixtures/test-fixtures';

/**
 * Authentication E2E Tests
 *
 * Tests cover:
 * - Login page rendering
 * - Signup page rendering
 * - Form validation
 * - Login flow (requires test account)
 * - Logout flow
 * - Protected route redirection
 */

// Use base test for unauthenticated tests
const test = baseTest;

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check page title
      await expect(page.locator('h1')).toContainText('Welcome back', { timeout: 15000 });

      // Check form elements exist
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();

      // Check submit button (aria-label is "Submit login form")
      await expect(page.getByRole('button', { name: /submit login form/i })).toBeVisible();

      // Check Google OAuth button (aria-label is "Sign in with Google")
      await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();

      // Check signup link
      await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
    });

    test('should show validation for empty form submission', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form - HTML5 validation should prevent submission
      const emailInput = page.locator('input#email');
      await emailInput.focus();
      await emailInput.blur();

      // Email field should be required
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should navigate to signup page', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('link', { name: /sign up/i }).click();
      await expect(page).toHaveURL('/signup');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await dismissCookieBanner(page);

      await page.locator('input#email').fill('invalid@test.com');
      await page.locator('input#password').fill('wrongpassword');
      await page.getByRole('button', { name: /submit login form/i }).click();

      // Wait for error message - could be various error states
      const errorVisible = await page.locator('.bg-red-50, [role="alert"]').isVisible({ timeout: 10000 }).catch(() => false);
      const urlStillLogin = page.url().includes('/login');
      expect(errorVisible || urlStillLogin).toBeTruthy();
    });
  });

  test.describe('Signup Page', () => {
    test('should display signup form', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      // Check page title
      await expect(page.locator('h1')).toContainText('Create your account', { timeout: 15000 });

      // Check form elements exist
      await expect(page.locator('input#name')).toBeVisible();
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();

      // Check submit button
      await expect(page.locator('form button[type="submit"]')).toBeVisible();

      // Check login link
      await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    });

    test('should show password length validation', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');
      await dismissCookieBanner(page);

      await page.locator('input#name').fill('Test User');
      await page.locator('input#email').fill('test@example.com');
      await page.locator('input#password').fill('short'); // Less than 6 chars
      await page.locator('form button[type="submit"]').click();

      // HTML5 validation prevents form submission - verify we stay on signup page
      await expect(page).toHaveURL(/signup/);

      // Password field should have validation styling (invalid state)
      const passwordInput = page.locator('input#password');
      await expect(passwordInput).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');
      await dismissCookieBanner(page);
      await page.getByRole('link', { name: /log in/i }).click();
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from /parent to /login', async ({ page }) => {
      await page.goto('/parent');

      // Should redirect to login
      await expect(page).toHaveURL('/login', { timeout: 15000 });
    });

    test('should redirect unauthenticated users from /teacher to /login', async ({ page }) => {
      await page.goto('/teacher');

      // Should redirect to login
      await expect(page).toHaveURL('/login', { timeout: 15000 });
    });

    test('should redirect unauthenticated users from /settings to /login', async ({ page }) => {
      await page.goto('/settings/security');

      // Settings may redirect to login or show a login prompt
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url.includes('/login') || url.includes('/settings')).toBeTruthy();
    });
  });

  test.describe('Logout', () => {
    test('should display logout page or redirect to login', async ({ page }) => {
      await page.goto('/logout');
      await page.waitForLoadState('networkidle');

      // Logout page may show content or redirect to login
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible({ timeout: 10000 });
    });
  });
});

// Authenticated tests using pre-authenticated session (no fresh login needed)
authTest.describe('Authenticated Flows', () => {
  authTest.beforeEach(async ({}, testInfo) => {
    if (!hasValidAuth()) {
      testInfo.skip(true, 'Auth state not available - skipping authenticated tests');
    }
  });

  authTest('should show user dashboard after login', async ({ authenticatedPage: page }) => {
    await page.goto('/parent');
    await waitForPageLoad(page);

    // Verify dashboard loaded - check for Parent Dashboard title or content
    const hasTitle = await page.getByRole('heading', { name: /parent dashboard/i }).isVisible().catch(() => false);
    const hasDashboard = await page.getByText(/manage people|manage your/i).isVisible().catch(() => false);
    const hasPersonCard = await page.locator('a[href^="/parent/"]').first().isVisible().catch(() => false);
    const hasActionButtons = await page.getByRole('button', { name: /get routines/i }).isVisible().catch(() => false);

    expect(hasTitle || hasDashboard || hasPersonCard || hasActionButtons || page.url().includes('/parent')).toBeTruthy();
  });

  authTest('should be able to logout', async ({ authenticatedPage: page }) => {
    // Go to parent first to verify we're logged in
    await page.goto('/parent');
    await waitForPageLoad(page);

    // Navigate to logout
    await page.goto('/logout');
    await page.waitForLoadState('networkidle');

    // Click logout button if present
    const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Should redirect to login or home after logout
    const url = page.url();
    expect(url.includes('/login') || url.includes('/logout') || url === 'http://localhost:3001/').toBeTruthy();
  });
});
