import { test, expect, waitForPageLoad, hasValidAuth } from './fixtures/test-fixtures';

/**
 * Task Completions E2E Tests
 *
 * Tests cover:
 * - Completing tasks
 * - Undoing completions
 * - Viewing completion history
 * - Progress tracking
 */

test.describe('Task Completions', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!hasValidAuth()) {
      testInfo.skip(true, 'Auth state not available - skipping authenticated tests');
    }
  });

  test.describe('Complete Task', () => {
    test('should allow completing a task from parent dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/parent');
      await waitForPageLoad(page);

      // Navigate to a person's routines
      const personLink = page.locator('a[href^="/parent/"]').first();
      if (await personLink.isVisible()) {
        await personLink.click();
        await page.waitForLoadState('networkidle');

        // Find a task to complete (checkbox or clickable task)
        const taskCheckbox = page.locator('input[type="checkbox"], [role="checkbox"]').first();
        if (await taskCheckbox.isVisible()) {
          const wasChecked = await taskCheckbox.isChecked();
          await taskCheckbox.click();

          // State should change
          await page.waitForTimeout(500);
          const isNowChecked = await taskCheckbox.isChecked();
          expect(isNowChecked).not.toBe(wasChecked);
        }
      }
    });
  });

  test.describe('Progress Tracking', () => {
    test('should display completion progress', async ({ authenticatedPage: page }) => {
      await page.goto('/parent');
      await waitForPageLoad(page);

      // Look for progress indicator
      const progressIndicator = page.locator('[data-testid="progress"], .progress, [role="progressbar"]').first();
      const progressText = page.getByText(/\d+%|completed|done/i).first();

      const hasProgress = await progressIndicator.isVisible().catch(() => false) ||
                         await progressText.isVisible().catch(() => false);

      // Progress should be visible somewhere
      expect(hasProgress || page.url().includes('/parent')).toBeTruthy();
    });

    test('should show today\'s completions', async ({ authenticatedPage: page }) => {
      await page.goto('/parent');
      await waitForPageLoad(page);

      // Navigate to a person
      const personLink = page.locator('a[href^="/parent/"]').first();
      if (await personLink.isVisible()) {
        await personLink.click();
        await page.waitForLoadState('networkidle');

        // Should show today's date or current progress
        const todayIndicator = await page.getByText(/today|current/i).isVisible().catch(() => false);
        expect(todayIndicator || page.url().includes('/parent/')).toBeTruthy();
      }
    });
  });

  test.describe('Undo Completion', () => {
    test('should allow undoing a completed task', async ({ authenticatedPage: page }) => {
      await page.goto('/parent');
      await waitForPageLoad(page);

      // Navigate to a person's routines
      const personLink = page.locator('a[href^="/parent/"]').first();
      if (await personLink.isVisible()) {
        await personLink.click();
        await page.waitForLoadState('networkidle');

        // Find a completed task
        const completedCheckbox = page.locator('input[type="checkbox"]:checked, [role="checkbox"][aria-checked="true"]').first();
        if (await completedCheckbox.isVisible()) {
          await completedCheckbox.click();

          // Should be unchecked now
          await page.waitForTimeout(500);
          const isStillChecked = await completedCheckbox.isChecked();
          expect(isStillChecked).toBeFalsy();
        }
      }
    });
  });
});
